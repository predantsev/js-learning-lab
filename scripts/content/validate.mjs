// Content validator: static contract checks plus real execution of every example, exercise fixture
// and verifiable prediction through the same runtime the learner uses: the browser sandbox (headless
// Chrome) for browser runtimes, the local isolated Node executor (POST /api/node/run) for
// `isolated-node` blocks.
//
//   node scripts/content/validate.mjs                 all content
//   node scripts/content/validate.mjs --unit JS-05    one unit (repeatable, comma-separated)
//   node scripts/content/validate.mjs --lesson js-05-03-filter
//   node scripts/content/validate.mjs --static        skip execution
//   node scripts/content/validate.mjs --release       also require complete coverage (no missing lessons)
//                                                     and real execution of every isolated-node block
//   node scripts/content/validate.mjs --json out.json machine-readable report
//   node scripts/content/validate.mjs --capstone wishlist   capstone steps of one capstone only
// Capstone steps (content/capstones) are selected with their unit (--unit) or step lesson (--lesson).
// When this machine cannot run the isolated Node executor, its blocks are reported as UNVERIFIED
// (a note, or an error with --release) — never as passed.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from '../../server/config.mjs';
import { consoleLines, localizeFiles, localizeText, runInputForBlock } from '../../shared/exercise.js';
import { NODE_RUN_PATH, isLearnerSyntaxError, nodeRunRequest, parseUncaughtError, readNdjson, testsOutcome, workspaceShortener } from '../../shared/node-run.js';
import { unitOfLesson } from '../../shared/content-schema.js';
import { buildContent, exerciseFileSets } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const values = (name) => args.flatMap((a, i) => (a === name && args[i + 1] ? args[i + 1].split(',') : []));
const onlyUnits = new Set(values('--unit').map((u) => u.toUpperCase()));
const onlyLessons = new Set(values('--lesson'));
const jsonOut = values('--json')[0] ?? null;
const release = flag('--release');
const selected = (lessonId) => (onlyUnits.size === 0 && onlyLessons.size === 0) || onlyUnits.has(unitOfLesson(lessonId)) || onlyLessons.has(lessonId);

const errors = [];
const notes = [];
const error = (where, message) => errors.push({ where, message });

const tmpOut = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-content-'));
const warnings = [];
const { issues, warnings: contentWarnings, all, index } = await buildContent({ outDir: tmpOut, quiet: true, release });
for (const issue of [...issues, ...contentWarnings]) {
  const lessonId = /lesson ([a-z0-9-]+)/.exec(issue.path)?.[1];
  if (lessonId && !selected(lessonId)) continue;
  const where = issue.file ? `${issue.file} · ${issue.path}` : issue.path;
  if (issue.level === 'warning') warnings.push({ where, message: issue.message });
  else error(where, issue.message);
}

const lessons = [...all.lessons.entries()].filter(([id]) => selected(id));
let executed = { examples: 0, fixtures: 0, predictions: 0, nodeRuns: 0, nodeUnverified: 0, capstoneRuns: 0 };
const onlyCapstones = new Set(values('--capstone'));
const capstoneSteps = Object.entries(all.capstoneBuild?.capstones ?? {})
  .filter(([id]) => onlyCapstones.size === 0 || onlyCapstones.has(id))
  .flatMap(([id, c]) => c.steps.map((step) => ({ id, step })))
  .filter(({ step }) => (onlyUnits.size === 0 && onlyLessons.size === 0) || onlyUnits.has(step.unit) || (step.lesson !== null && onlyLessons.has(step.lesson)));

if (!flag('--static') && (lessons.length > 0 || capstoneSteps.length > 0)) {
  const needBuild = !(await fs.access(path.join(ROOT, 'dist', 'app', 'harness.html')).then(() => true, () => false)) || !(await fs.access(path.join(ROOT, 'dist', 'sandbox', 'frame.html')).then(() => true, () => false));
  if (needBuild) {
    console.error('Platform assets are not built: run "npm run build" first (the validator executes fixtures in the real sandbox).');
    process.exit(2);
  }
  const { startServer } = await import('../../server/app.mjs');
  const { chromium } = await import('playwright-core');
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-validate-'));
  const runtimeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-validate-runtime-'));
  const server = await startServer({ port: 0, dataDir, runtimeDir, quiet: true });
  // Chrome starts on the first browser run, so isolated-node content validates without it.
  let browser = null;
  let page = null;
  const browserPage = async () => {
    if (page) return page;
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e) {
      console.error(`Cannot launch Google Chrome for fixture execution: ${String(e.message).split('\n')[0]}`);
      process.exit(2);
    }
    page = await browser.newPage();
    await page.goto(`http://js-learning-lab.localhost:${server.port}/harness.html`);
    await page.waitForFunction(() => document.documentElement.dataset.harness === 'ready');
    return page;
  };
  const run = async (input) => (await browserPage()).evaluate((i) => window.jsll.runProject(i), input);

  // ---- isolated-node blocks: the real executor through its HTTP API, as the learner's UI uses it ----
  const nodeFeature = server.api.features.isolatedNode ?? { available: false, reason: 'the Node executor module (server/api/node-run.mjs) is not loaded' };
  const runNode = async (body) => {
    executed.nodeRuns += 1;
    const response = await fetch(`http://localhost:${server.port}${NODE_RUN_PATH}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-jsll-token': server.store.meta.token }, body: JSON.stringify(body) });
    if (!(response.headers.get('content-type') ?? '').startsWith('application/x-ndjson')) {
      const data = await response.json().catch(() => ({}));
      return { failure: `the executor refused the run: HTTP ${response.status} ${data.error ?? ''} ${data.message ?? ''}`.trim() };
    }
    const r = { start: null, stdout: '', stderr: '', tests: null, exit: null };
    await readNdjson(response.body, (event) => {
      if (event.type === 'start') r.start = event;
      else if (event.type === 'stdout') r.stdout += event.data;
      else if (event.type === 'stderr') r.stderr += event.data;
      else if (event.type === 'tests') r.tests = event;
      else if (event.type === 'exit') r.exit = event;
    });
    if (!r.exit) return { ...r, failure: 'the run ended without an exit event (connection lost)' };
    const ended = { timeout: `reached its ${body.timeoutMs ?? 10_000} ms time limit (examples and checks must finish on their own)`, 'output-limit': 'printed more than the output limit', 'workspace-limit': 'wrote more files than the workspace limit', crashed: `crashed (${r.exit.signal ?? 'signal'})`, 'spawn-failed': `could not start Node (${r.exit.error ?? ''})` }[r.exit.reason];
    return ended ? { ...r, failure: `the run ${ended}` } : r;
  };
  const nodeUnverified = (where) => {
    executed.nodeUnverified += 1;
    const message = `UNVERIFIED: the isolated Node executor is not available on this machine, so this isolated-node block was not executed (${nodeFeature.reason})`;
    if (release) error(where, message);
    else notes.push({ where, message });
  };
  async function validateNodeBlock(where, block, assets, langs) {
    if (!nodeFeature.available) return nodeUnverified(where);
    if (block.kind === 'example') {
      for (const lang of langs) {
        const r = await runNode(nodeRunRequest(block, localizeFiles(assets.files, block, lang), { mode: 'run', lang }));
        if (r.failure) {
          error(where, `example (${lang}): ${r.failure}`);
          continue;
        }
        const thrown = parseUncaughtError(r.stderr, r.start?.cwd);
        const failed = r.exit.code !== 0;
        const what = thrown ? `throws ${thrown.name}: ${thrown.message}` : `exits with code ${r.exit.code}`;
        if (failed && block.expectError !== true) error(where, `example (${lang}) ${what} (set expectError: true if the error is the point)`);
        else if (!failed && block.expectError === true) error(where, `example (${lang}) declares expectError but runs without an error`);
      }
      return undefined;
    }
    if (assets.tests === null) return undefined;
    const compiledBlock = { ...block, tests: assets.tests };
    const titled = new Set(Object.keys(block.testTitles ?? {}));
    for (const lang of langs) for (const [name, rawFiles] of Object.entries(exerciseFileSets(assets))) {
      const shouldPass = name === 'solution' || name.startsWith('alt');
      const r = await runNode(nodeRunRequest(compiledBlock, localizeFiles(rawFiles, block, lang), { mode: 'test', lang }));
      if (r.failure && !r.tests) {
        error(where, `${name} (${lang}): ${r.failure}`);
        continue;
      }
      const outcome = testsOutcome(r.tests, workspaceShortener(r.start?.cwd));
      if (outcome.harnessError) {
        // As for browser fixtures: a starter or a deliberately wrong fixture may fail to compile or
        // to link (that counts as failing); a passing fixture may not, and no fixture may stop the
        // checks in another way (time limit, crash, an error in tests.js).
        const harness = outcome.harnessError;
        const compileLike = isLearnerSyntaxError(harness) || (harness.name === 'SyntaxError' && /does not provide an export named/.test(harness.message)) || harness.code === 'ERR_MODULE_NOT_FOUND';
        if (shouldPass || !compileLike || r.failure) error(where, `${name} (${lang}): ${r.failure ?? `tests could not start: ${harness.name}: ${harness.message}`}`);
        continue;
      }
      if (r.failure) {
        error(where, `${name} (${lang}): ${r.failure}`);
        continue;
      }
      const tests = outcome.results;
      const failed = tests.filter((t) => t.status !== 'pass');
      if (name === 'solution') {
        if (tests.length === 0) error(where, 'tests.js defines no tests');
        for (const t of tests) if (!titled.has(t.name)) error(where, `test "${t.name}" has no bilingual title in testTitles`);
        for (const t of titled) if (!tests.some((x) => x.name === t)) error(where, `testTitles names "${t}" but tests.js has no such test`);
        for (const rule of block.feedback ?? []) if (rule.when?.test && !tests.some((x) => x.name === rule.when.test)) error(where, `feedback refers to unknown test "${rule.when.test}"`);
        const thrown = outcome.errors[0];
        if (thrown && block.expectError !== true) error(where, `solution throws ${thrown.name}: ${thrown.message}`);
      }
      if (shouldPass && failed.length > 0) error(where, `${name} (${lang}) must pass every test, but fails: ${failed.map((t) => `"${t.name}" (${t.message})`).join('; ')}`);
      if (!shouldPass && failed.length === 0 && !(name === 'starter' && block.starterPasses === true)) error(where, `${name} (${lang}) passes every test — ${name === 'starter' ? 'the exercise asks for nothing (or set starterPasses: true with a reason)' : 'a deliberately wrong fixture must fail at least one test'}`);
    }
    return undefined;
  }

  const describeFailure = (r) => {
    if (r.status === 'compile-error') return `does not compile: ${r.compileErrors.map((e) => `${e.file}:${e.line ?? '?'} ${e.message}`).join('; ')}`;
    if (r.status !== 'done') return `run ended with status "${r.status}"`;
    if (r.harnessError) return `tests could not start: ${r.harnessError.name}: ${r.harnessError.message}`;
    return null;
  };

  for (const [id, lesson] of lessons) {
    for (const block of lesson.source.blocks ?? []) {
      const where = `${id} › ${block.id}`;
      const assets = lesson.assets[block.id];
      if (block.kind === 'prediction' || block.kind === 'review') {
        const items = block.kind === 'prediction' ? [block] : block.items ?? [];
        for (const item of items) {
          if (!item.verify || typeof item.code !== 'string') continue;
          for (const lang of block.strings ? ['uk', 'en'] : ['uk']) {
            executed.predictions += 1;
            const expected = item.verify.logs.map((l) => localizeText(String(l), block, lang));
            const r = await run({ files: { 'index.js': localizeText(item.code, block, lang) }, entry: 'index.js', runtime: 'browser-js', options: {} });
            const failure = describeFailure(r);
            const expectErrors = item.verify.error ?? null;
            // Code that does not even compile can be the point of a prediction: nothing is printed
            // and the "error" is a SyntaxError (verify: { logs: [], error: SyntaxError }).
            const syntaxFailure = r.status === 'compile-error' && r.compileErrors.some((e) => e.kind === 'syntax');
            if (syntaxFailure && expectErrors === 'SyntaxError') {
              if (expected.length > 0) error(where, `prediction "${item.id ?? block.id}" (${lang}): the code does not compile, so it prints nothing, but verify.logs lists ${JSON.stringify(expected)}`);
            } else if (failure) error(where, `prediction code ${failure}${syntaxFailure ? ' (if the syntax error is the point, set verify: { logs: [], error: SyntaxError })' : ''}`);
            else {
              const lines = consoleLines(r.console);
              if (JSON.stringify(lines) !== JSON.stringify(expected)) error(where, `prediction "${item.id ?? block.id}" (${lang}): real output ${JSON.stringify(lines)} differs from verify.logs ${JSON.stringify(expected)}`);
              const thrown = r.errors[0]?.name ?? null;
              if (expectErrors !== thrown) error(where, `prediction "${item.id ?? block.id}": ${thrown ? `code throws ${thrown}` : 'code does not throw'} but verify.error is ${JSON.stringify(expectErrors)}`);
            }
          }
        }
        continue;
      }
      if (block.kind !== 'example' && block.kind !== 'exercise') continue;
      if (!assets) continue;
      const langs = block.strings ? ['uk', 'en'] : ['uk'];
      if (block.runtime === 'isolated-node') {
        await validateNodeBlock(where, block, assets, langs);
        continue;
      }
      if (block.kind === 'example') {
        for (const lang of langs) {
          executed.examples += 1;
          const r = await run(runInputForBlock({ ...block, tests: '' }, localizeFiles(assets.files, block, lang), { mode: 'run', lang }));
          const failure = describeFailure(r);
          // An example may demonstrate an error on purpose, including one that prevents running.
          if (failure && !(block.expectError === true && r.status === 'compile-error')) error(where, `example (${lang}) ${failure}`);
          else if (failure) continue;
          else if (r.errors.length > 0 && block.expectError !== true) error(where, `example throws ${r.errors[0].name}: ${r.errors[0].message} (set expectError: true if the error is the point)`);
          else if (r.errors.length === 0 && block.expectError === true) error(where, 'example declares expectError but runs without an error');
        }
        continue;
      }
      if (assets.tests === null) continue;
      const sets = exerciseFileSets(assets);
      const compiledBlock = { ...block, tests: assets.tests };
      const titled = new Set(Object.keys(block.testTitles ?? {}));
      for (const lang of langs) for (const [rawName, rawFiles] of Object.entries(sets)) {
        const name = rawName;
        const files = localizeFiles(rawFiles, block, lang);
        executed.fixtures += 1;
        const r = await run(runInputForBlock(compiledBlock, files, { mode: 'test', lang }));
        const failure = describeFailure(r);
        const shouldPass = name === 'solution' || name.startsWith('alt');
        if (failure) {
          // A starter or a deliberately wrong fixture may fail to compile (that counts as failing);
          // a passing fixture may not, and no fixture may crash the harness in another way.
          if (shouldPass || r.status !== 'compile-error') error(where, `${name} (${lang}): ${failure}`);
          continue;
        }
        const tests = r.tests ?? [];
        const failed = tests.filter((t) => t.status !== 'pass');
        if (name === 'solution') {
          if (tests.length === 0) error(where, 'tests.js defines no tests');
          for (const t of tests) if (!titled.has(t.name)) error(where, `test "${t.name}" has no bilingual title in testTitles`);
          for (const t of titled) if (!tests.some((x) => x.name === t)) error(where, `testTitles names "${t}" but tests.js has no such test`);
          for (const rule of block.feedback ?? []) if (rule.when?.test && !tests.some((x) => x.name === rule.when.test)) error(where, `feedback refers to unknown test "${rule.when.test}"`);
          if (r.errors.length > 0 && block.expectError !== true) error(where, `solution throws ${r.errors[0].name}: ${r.errors[0].message}`);
        }
        if (shouldPass && failed.length > 0) error(where, `${name} must pass every test, but fails: ${failed.map((t) => `"${t.name}" (${t.message})`).join('; ')}`);
        if (!shouldPass && failed.length === 0 && !(name === 'starter' && block.starterPasses === true)) error(where, `${name} passes every test — ${name === 'starter' ? 'the exercise asks for nothing (or set starterPasses: true with a reason)' : 'a deliberately wrong fixture must fail at least one test'}`);
      }
    }
  }

  // ---- capstone steps: in both languages the reference passes every check and runs without
  // errors, and the state before the step (CP-START or the previous reference) fails at least one ----
  for (const { id, step } of capstoneSteps) {
    const where = `capstone ${id} › step ${step.unit}`;
    if (step.mode !== 'in-platform') {
      notes.push({ where, message: 'local step: checked statically only' });
      continue;
    }
    if (!step.reference || !step.tests) continue; // reported by the static checks
    const block = { entry: step.entry, runtime: step.runtime, tests: step.tests, strings: step.strings, capabilities: step.capabilities };
    for (const lang of ['uk', 'en']) {
      for (const [name, raw, shouldPass] of [['reference', step.reference, true], ['state before the step', step.previous, false]]) {
        executed.capstoneRuns += 1;
        const r = await run(runInputForBlock(block, localizeFiles(raw, block, lang), { mode: 'test', lang }));
        const failure = describeFailure(r);
        if (failure) {
          error(where, `${name} (${lang}): ${failure}`);
          continue;
        }
        const tests = r.tests ?? [];
        const failed = tests.filter((t) => t.status !== 'pass');
        if (shouldPass) {
          if (tests.length === 0) error(where, 'tests.js defines no tests');
          for (const t of tests) if (!step.testTitles[t.name]) error(where, `test "${t.name}" has no bilingual title in testTitles`);
          if (failed.length > 0) error(where, `reference (${lang}) must pass every check, but fails: ${failed.map((t) => `"${t.name}" (${t.message})`).join('; ')}`);
          if (r.errors.length > 0) error(where, `reference (${lang}) throws ${r.errors[0].name}: ${r.errors[0].message}`);
        } else if (failed.length === 0) error(where, `the ${name} (${lang}) already passes every check — the step asks for nothing`);
      }
    }
  }
  await browser?.close();
  await server.close();
  await fs.rm(dataDir, { recursive: true, force: true });
  await fs.rm(runtimeDir, { recursive: true, force: true });
}

// ---- unit-level teaching-loop coverage (REQ-005, REQ-007) for fully selected units ----
const unitIds = [...new Set(lessons.map(([id]) => unitOfLesson(id)))];
for (const unit of unitIds) {
  const planned = all.order.filter((o) => o.unit === unit);
  const missing = planned.filter((o) => !o.authored);
  if (missing.length > 0) {
    if (release) error(`unit ${unit}`, `lessons not authored yet: ${missing.map((m) => m.id).join(', ')}`);
    else notes.push({ where: `unit ${unit}`, message: `${missing.length} planned lesson(s) not authored yet` });
    continue;
  }
  const blocks = planned.flatMap((o) => all.lessons.get(o.id).source.blocks ?? []);
  const has = (pred) => blocks.some(pred);
  if (!has((b) => b.kind === 'prediction')) error(`unit ${unit}`, 'no prediction block in the unit');
  if (!has((b) => b.kind === 'exercise' && b.mode === 'guided')) error(`unit ${unit}`, 'no guided code-writing exercise in the unit');
  if (!has((b) => b.kind === 'exercise' && b.mode === 'debug')) error(`unit ${unit}`, 'no debugging exercise in the unit');
  // A unit whose capstone step is done locally (a checkpoint outside the platform) has its independent
  // practice there: the learner carries the step out alone and the platform cannot check an exercise for it.
  const localStep = (all.syllabus.get(unit)?.capstoneStep?.mode ?? 'in-platform') !== 'in-platform';
  if (!localStep && !has((b) => b.kind === 'exercise' && b.mode === 'independent')) error(`unit ${unit}`, 'no independent (no-hint) exercise in the unit');
  const firstUnit = all.competencies.unitOrder[0].unit;
  const retrieval = blocks.filter((b) => b.kind === 'review').flatMap((b) => b.items ?? []);
  if (unit !== firstUnit && retrieval.length < 2) error(`unit ${unit}`, 'needs at least two retrieval questions about earlier lessons (review blocks)');
}

// ---- competency closure (release only): every subskill introduced and assessed ----
if (release) {
  const seen = new Map();
  for (const [, lesson] of all.lessons) for (const s of lesson.source.subskills ?? []) {
    const key = `${s.family}::${s.skill}`;
    if (!seen.has(key)) seen.set(key, new Set());
    seen.get(key).add(s.depth);
  }
  for (const [family, info] of all.competencies.families) for (const skill of info.subskills) {
    const depths = seen.get(`${family}::${skill}`) ?? new Set();
    if (!depths.has('intro') && !depths.has('practice')) error(`competency ${family}`, `subskill "${skill}" is never taught`);
    if (!depths.has('assess')) error(`competency ${family}`, `subskill "${skill}" is never assessed`);
  }
}

await fs.rm(tmpOut, { recursive: true, force: true });
const report = { ok: errors.length === 0, verified: executed.nodeUnverified === 0, lessons: lessons.length, capstoneSteps: capstoneSteps.length, executed, errors, warnings, notes, contentVersion: index.contentVersion };
if (jsonOut) await fs.writeFile(jsonOut, JSON.stringify(report, null, 2));
for (const e of errors) console.error(`✖ ${e.where} — ${e.message}`);
for (const w of warnings) console.error(`⚠ ${w.where} — warning: ${w.message}`);
for (const n of notes) console.error(`· ${n.where} — ${n.message}`);
const nodeSummary = `${executed.nodeRuns} isolated-node run(s)${executed.nodeUnverified > 0 ? ` (${executed.nodeUnverified} isolated-node block(s) UNVERIFIED: executor unavailable)` : ''}`;
// Blocks that could not be executed are never reported as valid (a note now; an error with --release).
const verdict = errors.length > 0 ? 'CONTENT INVALID' : executed.nodeUnverified > 0 ? 'CONTENT UNVERIFIED' : 'CONTENT VALID';
console.log(`${verdict}: ${lessons.length} lesson(s), ${executed.examples} example run(s), ${executed.fixtures} exercise fixture run(s), ${executed.predictions} verified prediction(s), ${nodeSummary}, ${capstoneSteps.length} capstone step variant(s) with ${executed.capstoneRuns} capstone run(s), ${errors.length} error(s)${warnings.length > 0 ? `, ${warnings.length} warning(s)` : ''}`);
process.exit(errors.length === 0 ? 0 : 1);
