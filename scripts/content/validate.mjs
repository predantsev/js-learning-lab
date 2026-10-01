// Content validator: static contract checks plus real execution of every example, exercise fixture
// and verifiable prediction through the same sandbox the learner uses (headless Chrome).
//
//   node scripts/content/validate.mjs                 all content
//   node scripts/content/validate.mjs --unit JS-05    one unit (repeatable, comma-separated)
//   node scripts/content/validate.mjs --lesson js-05-03-filter
//   node scripts/content/validate.mjs --static        skip execution
//   node scripts/content/validate.mjs --release       also require complete coverage (no missing lessons)
//   node scripts/content/validate.mjs --json out.json machine-readable report
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from '../../server/config.mjs';
import { consoleLines, localizeFiles, localizeText, runInputForBlock } from '../../shared/exercise.js';
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
const { issues, all, index } = await buildContent({ outDir: tmpOut, quiet: true });
for (const issue of issues) {
  const lessonId = /lesson ([a-z0-9-]+)/.exec(issue.path)?.[1];
  if (lessonId && !selected(lessonId)) continue;
  error(issue.file ? `${issue.file} · ${issue.path}` : issue.path, issue.message);
}

const lessons = [...all.lessons.entries()].filter(([id]) => selected(id));
let executed = { examples: 0, fixtures: 0, predictions: 0, nodeSkipped: 0 };

if (!flag('--static') && lessons.length > 0) {
  const needBuild = !(await fs.access(path.join(ROOT, 'dist', 'app', 'harness.html')).then(() => true, () => false)) || !(await fs.access(path.join(ROOT, 'dist', 'sandbox', 'frame.html')).then(() => true, () => false));
  if (needBuild) {
    console.error('Platform assets are not built: run "npm run build" first (the validator executes fixtures in the real sandbox).');
    process.exit(2);
  }
  const { startServer } = await import('../../server/app.mjs');
  const { chromium } = await import('playwright-core');
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-validate-'));
  const server = await startServer({ port: 0, dataDir, quiet: true });
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    console.error(`Cannot launch Google Chrome for fixture execution: ${String(e.message).split('\n')[0]}`);
    process.exit(2);
  }
  const page = await browser.newPage();
  await page.goto(`http://js-learning-lab.localhost:${server.port}/harness.html`);
  await page.waitForFunction(() => document.documentElement.dataset.harness === 'ready');
  const run = (input) => page.evaluate((i) => window.jsll.runProject(i), input);
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
            if (failure) error(where, `prediction code ${failure}`);
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
      if (block.runtime === 'isolated-node') {
        executed.nodeSkipped += 1;
        notes.push({ where, message: 'isolated-node fixtures are validated by scripts/content/validate-node.mjs' });
        continue;
      }
      const langs = block.strings ? ['uk', 'en'] : ['uk'];
      if (block.kind === 'example') {
        for (const lang of langs) {
          executed.examples += 1;
          const r = await run(runInputForBlock({ ...block, tests: '' }, localizeFiles(assets.files, block, lang), { mode: 'run', lang }));
          const failure = describeFailure(r);
          if (failure) error(where, `example (${lang}) ${failure}`);
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
        if (failure && (shouldPass || r.status !== 'compile-error')) {
          // A deliberately wrong or unfinished fixture may fail to compile; a passing one may not.
          if (shouldPass || name === 'starter') error(where, `${name}: ${failure}`);
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
  await browser.close();
  await server.close();
  await fs.rm(dataDir, { recursive: true, force: true });
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
  if (!has((b) => b.kind === 'exercise' && b.mode === 'independent')) error(`unit ${unit}`, 'no independent (no-hint) exercise in the unit');
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
const report = { ok: errors.length === 0, lessons: lessons.length, executed, errors, notes, contentVersion: index.contentVersion };
if (jsonOut) await fs.writeFile(jsonOut, JSON.stringify(report, null, 2));
for (const e of errors) console.error(`✖ ${e.where} — ${e.message}`);
for (const n of notes) console.error(`· ${n.where} — ${n.message}`);
console.log(`${errors.length === 0 ? 'CONTENT VALID' : 'CONTENT INVALID'}: ${lessons.length} lesson(s), ${executed.examples} example run(s), ${executed.fixtures} exercise fixture run(s), ${executed.predictions} verified prediction(s), ${errors.length} error(s)`);
process.exit(errors.length === 0 ? 0 : 1);
