// Capstone projects: CP-START starters and per-unit steps → dist/content/capstones/<id>.json, plus the
// synthesized capstone-step lessons (one per syllabus `capstone-step` lesson whose step exists).
// Format and rules: content/capstones/README.md. Static checks live here; the validator executes the
// step references and the previous states in the real sandbox (scripts/content/validate.mjs).
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { ROOT } from '../../server/config.mjs';
import { CAPSTONES, LANGS } from '../../shared/content-schema.js';
import { STRING_PLACEHOLDER } from '../../shared/exercise.js';
import { pathProblem } from '../../shared/capstone.js';

export const CAPSTONES_DIR = path.join(ROOT, 'content', 'capstones');
export const STEP_MODES = ['in-platform', 'local'];
const TEXT_EXT = new Set(['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.txt', '.svg', '.csv', '.xml', '.gitignore']);
const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/;
const L_REFERENCE = /\bL\.([a-zA-Z_$][\w$]*)|\bL\[\s*(['"])([^'"]+)\2\s*\]/g;
const TEST_NAME = /\btest\(\s*(['"`])((?:\\.|(?!\1).)+)\1/g;

const exists = (p) => fs.access(p).then(() => true, () => false);
const readYaml = async (file) => YAML.parse(await fs.readFile(file, 'utf8'));
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isLocalized = (v) => isObject(v) && LANGS.every((l) => typeof v[l] === 'string' && v[l].trim() !== '');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

async function readTree(dir, base = dir) {
  const out = {};
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, await readTree(full, base));
    else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase()) || TEXT_EXT.has(entry.name)) out[path.relative(base, full).split(path.sep).join('/')] = await fs.readFile(full, 'utf8');
  }
  return out;
}

async function readYamlSafe(file, issues, where) {
  try {
    return await readYaml(file);
  } catch (error) {
    issues.push({ path: where, message: `cannot parse: ${error.message}`, file: rel(file) });
    return null;
  }
}

/**
 * Read every capstone source file. Steps are ordered by the course teaching order (unitOrder).
 * @returns {{ dir, start: Record<string, { files, strings, dir }>, steps: object[] }}
 */
export async function loadCapstoneSources({ dir = CAPSTONES_DIR, unitOrder, issues }) {
  const start = {};
  for (const id of CAPSTONES) {
    const base = path.join(dir, 'start', id);
    start[id] = {
      dir: base,
      files: await readTree(path.join(base, 'files')),
      strings: (await exists(path.join(base, 'strings.yaml'))) ? (await readYamlSafe(path.join(base, 'strings.yaml'), issues, `capstone ${id} › start strings`)) ?? {} : {},
    };
  }
  const order = new Map(unitOrder.map((u, i) => [u.unit, i]));
  const steps = [];
  const stepsDir = path.join(dir, 'steps');
  for (const entry of (await fs.readdir(stepsDir, { withFileTypes: true }).catch(() => [])).filter((e) => e.isDirectory())) {
    const unit = entry.name;
    const base = path.join(stepsDir, unit);
    const file = path.join(base, 'step.yaml');
    if (!(await exists(file))) {
      issues.push({ path: `capstone step ${unit}`, message: 'missing step.yaml', file: rel(base) });
      continue;
    }
    const source = (await readYamlSafe(file, issues, `capstone step ${unit}`)) ?? {};
    const sharedTests = await fs.readFile(path.join(base, 'tests.js'), 'utf8').catch(() => null);
    const variants = {};
    for (const sub of (await fs.readdir(base, { withFileTypes: true })).filter((e) => e.isDirectory())) {
      if (!CAPSTONES.includes(sub.name)) {
        issues.push({ path: `capstone step ${unit}`, message: `unknown capstone folder "${sub.name}" (expected ${CAPSTONES.join(', ')})`, file: rel(path.join(base, sub.name)) });
        continue;
      }
      const vdir = path.join(base, sub.name);
      variants[sub.name] = {
        dir: vdir,
        task: (await exists(path.join(vdir, 'task.yaml'))) ? await readYamlSafe(path.join(vdir, 'task.yaml'), issues, `capstone step ${unit} › ${sub.name}`) : null,
        reference: await readTree(path.join(vdir, 'reference')),
        tests: (await fs.readFile(path.join(vdir, 'tests.js'), 'utf8').catch(() => null)) ?? sharedTests,
      };
    }
    if (!order.has(unit)) issues.push({ path: `capstone step ${unit}`, message: 'folder name is not a curriculum unit id', file: rel(base) });
    steps.push({ unit, dir: base, source, variants, order: order.get(unit) ?? Number.MAX_SAFE_INTEGER });
  }
  steps.sort((a, b) => a.order - b.order);
  return { dir, start, steps };
}

const placeholders = (text) => [...String(text).matchAll(STRING_PLACEHOLDER)].map((m) => m[1]);
function localizedTexts(value, out = []) {
  if (isLocalized(value)) out.push(...LANGS.map((l) => value[l]));
  else if (Array.isArray(value)) value.forEach((v) => localizedTexts(v, out));
  else if (isObject(value)) Object.values(value).forEach((v) => localizedTexts(v, out));
  return out;
}

/** Synthesized lesson sources for syllabus `capstone-step` lessons without an authored directory. */
export function synthesizeStepLessons(sources, { syllabus, lessons }) {
  const out = [];
  for (const step of sources.steps) {
    const plan = syllabus.get(step.unit);
    const planned = (plan?.lessons ?? []).find((l) => l.kind === 'capstone-step');
    if (!planned || lessons.has(planned.id)) continue;
    const s = step.source ?? {};
    out.push({
      synthesized: true,
      dir: step.dir,
      assets: {},
      source: {
        id: planned.id,
        unit: step.unit,
        title: planned.title,
        kind: 'capstone-step',
        minutes: planned.minutes,
        contentVersion: 1,
        objectives: s.objectives,
        purpose: s.purpose,
        prerequisites: planned.prerequisites ?? [],
        subskills: planned.subskills ?? [],
        glossary: planned.glossary ?? [],
        capstoneStep: step.unit,
        blocks: [
          { id: 'step-intro', kind: 'explanation', title: s.title, body: s.intro },
          { id: 'open-step', kind: 'transfer', capstoneStep: step.unit, body: s.transfer },
        ],
      },
    });
  }
  return out;
}

/** The syllabus lesson id that hosts a unit's capstone step, or null. */
export const stepLessonId = (syllabus, unit) => (syllabus.get(unit)?.lessons ?? []).find((l) => l.kind === 'capstone-step')?.id ?? null;

/**
 * Static checks and compilation. Returns { capstones: Record<id, json>, issues }.
 * `md` is the markdown renderer of lib.mjs (block / inline / plain).
 */
export function compileCapstones(sources, { md, domains, syllabus }) {
  const issues = [];
  const add = (where, message, file) => issues.push({ path: where, message, ...(file ? { file: rel(file) } : {}) });
  const capstones = {};

  for (const step of sources.steps) {
    const s = step.source;
    const where = `capstone step ${step.unit}`;
    if (!isObject(s)) { add(where, 'step.yaml must contain a mapping', step.dir); continue; }
    if (s.unit !== step.unit) add(`${where} › unit`, `must equal the folder name "${step.unit}"`, step.dir);
    if (!STEP_MODES.includes(s.mode)) add(`${where} › mode`, `must be one of ${STEP_MODES.join(', ')}`, step.dir);
    for (const key of ['title', 'intro', 'purpose', 'transfer']) if (!isLocalized(s[key])) add(`${where} › ${key}`, 'missing bilingual text (needs uk and en)', step.dir);
    if (!Array.isArray(s.objectives) || s.objectives.length === 0 || !s.objectives.every(isLocalized)) add(`${where} › objectives`, 'list at least one bilingual objective', step.dir);
    if (s.entry !== undefined && (typeof s.entry !== 'string' || pathProblem(s.entry))) add(`${where} › entry`, 'must be a safe relative file path', step.dir);
    for (const text of localizedTexts([s.title, s.intro, s.purpose, s.transfer, s.objectives])) for (const key of placeholders(text)) add(where, `shared step text cannot use the capstone placeholder %%${key}%% (put domain wording in <capstone>/task.yaml)`, step.dir);
    for (const id of CAPSTONES) if (!step.variants[id]) add(where, `missing the ${id}/ variant (every step exists for all four capstones)`, step.dir);
  }

  for (const id of CAPSTONES) {
    const where = `capstone ${id}`;
    const start = sources.start[id];
    if (Object.keys(start.files).length === 0) add(`${where} › start`, 'missing CP-START files in start/<capstone>/files/', start.dir);
    if (!('index.html' in start.files)) add(`${where} › start`, 'CP-START needs files/index.html (the project entry page)', start.dir);
    for (const p of Object.keys(start.files)) if (pathProblem(p)) add(`${where} › start`, `unsafe file path "${p}"`, start.dir);
    const checkStrings = (table, at, file) => {
      if (!isObject(table)) { add(at, 'strings must map keys to bilingual text', file); return {}; }
      for (const [key, value] of Object.entries(table)) {
        if (!KEY_PATTERN.test(key)) add(`${at}.${key}`, 'keys are camelCase letters and digits (Markdown would turn "_" into emphasis)', file);
        if (!isLocalized(value)) add(`${at}.${key}`, 'missing bilingual text (needs uk and en)', file);
      }
      return table;
    };
    const startStrings = { ...checkStrings(start.strings, `${where} › start strings`, start.dir) };
    let strings = startStrings;
    for (const [p, text] of Object.entries(start.files)) for (const key of placeholders(text)) if (!(key in strings)) add(`${where} › start ${p}`, `placeholder %%${key}%% has no entry in strings.yaml`, start.dir);

    const steps = [];
    let previousFiles = start.files;
    for (const step of sources.steps) {
      const v = step.variants[id];
      const s = isObject(step.source) ? step.source : {};
      if (!v) continue;
      const at = `capstone step ${step.unit} › ${id}`;
      const task = v.task;
      if (!isObject(task)) { add(at, 'missing or invalid task.yaml', v.dir); continue; }
      const added = checkStrings(task.strings ?? {}, `${at} › strings`, v.dir);
      for (const [key, value] of Object.entries(added)) {
        if (key in strings && JSON.stringify(strings[key]) !== JSON.stringify(value)) add(`${at} › strings.${key}`, 'redefines an earlier key with different text (learner files created earlier keep the old text; use a new key)', v.dir);
      }
      strings = { ...strings, ...added };
      if (!isLocalized(task.instructions)) add(`${at} › instructions`, 'missing bilingual text (needs uk and en)', v.dir);
      if (task.nudge !== undefined && !isLocalized(task.nudge)) add(`${at} › nudge`, 'must be bilingual text', v.dir);
      const inPlatform = s.mode === 'in-platform';
      const entry = s.entry ?? 'index.html';
      const testNames = v.tests ? [...v.tests.matchAll(TEST_NAME)].map((m) => m[2]) : [];
      if (inPlatform) {
        if (Object.keys(v.reference).length === 0) add(at, 'missing reference/ files (the complete project after the step)', v.dir);
        else if (!(entry in v.reference)) add(at, `reference/ has no entry file "${entry}"`, v.dir);
        for (const p of Object.keys(v.reference)) if (pathProblem(p)) add(at, `unsafe file path "${p}" in reference/`, v.dir);
        if (!v.tests) add(at, 'missing tests.js (in the variant folder or shared in the step folder)', v.dir);
        if (!isObject(task.testTitles) || Object.keys(task.testTitles).length === 0) add(`${at} › testTitles`, 'must map every test name to a bilingual title', v.dir);
        else {
          for (const [name, title] of Object.entries(task.testTitles)) if (!isLocalized(title)) add(`${at} › testTitles["${name}"]`, 'missing bilingual text', v.dir);
          for (const name of testNames) if (!(name in task.testTitles)) add(`${at} › testTitles`, `test "${name}" has no bilingual title`, v.dir);
          for (const name of Object.keys(task.testTitles)) if (!testNames.includes(name)) add(`${at} › testTitles`, `names "${name}" but tests.js has no such test`, v.dir);
        }
        for (const [i, rule] of (task.feedback ?? []).entries()) {
          if (!isObject(rule?.when) || !(rule.when.test || rule.when.error)) add(`${at} › feedback[${i}]`, 'needs when.test (test name) or when.error (error name)', v.dir);
          else if (rule.when.test && !testNames.includes(rule.when.test)) add(`${at} › feedback[${i}]`, `refers to unknown test "${rule.when.test}"`, v.dir);
          if (!isLocalized(rule?.message)) add(`${at} › feedback[${i}].message`, 'missing bilingual text', v.dir);
        }
        for (const m of (v.tests ?? '').matchAll(L_REFERENCE)) {
          const key = m[1] ?? m[3];
          if (!(key in strings)) add(at, `tests.js reads L.${key}, which is not defined in the strings up to this step`, v.dir);
        }
      }
      const texts = [...Object.values(v.reference), ...localizedTexts([task.instructions, task.nudge, task.testTitles, (task.feedback ?? []).map((f) => f?.message)])];
      for (const text of texts) for (const key of placeholders(text)) if (!(key in strings)) add(at, `placeholder %%${key}%% is not defined in the strings up to this step`, v.dir);

      const render = (value, kind) => (isLocalized(value) ? Object.fromEntries(LANGS.map((l) => [l, md[kind](value[l])])) : null);
      steps.push({
        unit: step.unit,
        mode: s.mode,
        lesson: stepLessonId(syllabus, step.unit),
        title: render(s.title, 'plain'),
        intro: render(s.intro, 'block'),
        entry,
        runtime: 'browser-js',
        capabilities: isObject(task.capabilities) ? task.capabilities : {},
        instructions: render(task.instructions, 'block'),
        instructionsMd: isLocalized(task.instructions) ? task.instructions : null,
        nudge: render(task.nudge, 'block'),
        testTitles: Object.fromEntries(Object.entries(isObject(task.testTitles) ? task.testTitles : {}).filter(([, t]) => isLocalized(t)).map(([name, t]) => [name, render(t, 'inline')])),
        feedback: (task.feedback ?? []).filter((f) => isObject(f?.when) && isLocalized(f.message)).map((f) => ({ when: f.when, message: render(f.message, 'block') })),
        tests: inPlatform ? v.tests ?? '' : null,
        strings,
        reference: Object.keys(v.reference).length > 0 ? v.reference : null,
        previous: inPlatform ? previousFiles : null,
      });
      if (inPlatform && Object.keys(v.reference).length > 0) previousFiles = v.reference;
    }
    const domain = domains.capstones?.[id] ?? {};
    // `previous` is only needed by the validator; the app derives starting states from the step list.
    const compiled = {
      id,
      title: domain.title,
      pitch: domain.pitch,
      entry: 'index.html',
      start: { files: start.files, strings: startStrings },
      steps: steps.map(({ previous: _previous, ...rest }) => rest),
    };
    compiled.contentVersion = createHash('sha256').update(JSON.stringify(compiled)).digest('hex').slice(0, 12);
    capstones[id] = { compiled, steps };
  }
  return { capstones, issues: dedupe(issues) };
}

function dedupe(issues) {
  const seen = new Set();
  return issues.filter((i) => {
    const key = `${i.path}|${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function writeCapstones(outDir, capstones) {
  const texts = {};
  await fs.mkdir(outDir, { recursive: true });
  for (const [id, { compiled }] of Object.entries(capstones)) {
    texts[id] = JSON.stringify(compiled);
    await fs.writeFile(path.join(outDir, `${id}.json`), texts[id]);
  }
  return texts;
}
