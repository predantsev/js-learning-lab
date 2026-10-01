#!/usr/bin/env node
// Validates the lesson-level syllabus spine in content/syllabus/*.yaml against
// docs/competencies.json and the syllabus design rules (see content/syllabus/README.md).
// Exit code 1 on any error. Usage:
//   node scripts/content/validate-syllabus.mjs            # full validation (all 56 units, closure)
//   node scripts/content/validate-syllabus.mjs --partial  # validate only the unit files present
//   node scripts/content/validate-syllabus.mjs --quiet    # errors only, no summary
//   node scripts/content/validate-syllabus.mjs --partial --only=JS-03,JS-04   # show messages for these units only
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const syllabusDir = join(root, 'content', 'syllabus');
const args = new Set(process.argv.slice(2));
const partial = args.has('--partial');
const quiet = args.has('--quiet');
const onlyArg = [...args].find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim()).filter(Boolean)) : null;
const inScope = (msg) => !only || msg.startsWith('closure') || msg.startsWith('syllabus') || [...only].some((u) => msg.startsWith(`${u}.yaml`));

const STAGES = ['JS', 'RE', 'RN', 'NO'];
const LESSON_KINDS = ['instructional', 'review', 'assessment', 'local-task', 'capstone-step'];
const DEPTHS = ['intro', 'practice', 'assess'];
const RUNTIMES = ['browser-js', 'browser-react', 'concept-preview', 'isolated-node', 'local-web', 'local-native', 'local-node'];
const VISUALS = ['code-trace', 'memory-graph', 'pipeline', 'event-loop', 'diagram', 'sequence', 'git-graph', 'render-timeline'];
const PRACTICE_KINDS = ['predict', 'run-change', 'write', 'debug', 'independent', 'local-task', 'review'];
const DIFFICULT = ['scope-closure', 'reference-identity', 'event-loop-async', 'render-state-snapshot', 'effect-cleanup', 'client-server-boundary', 'native-web-boundary'];
const CAPSTONE_MODES = ['in-platform', 'local'];
const DOMAINS = ['wishlist', 'planner', 'habits', 'expenses'];
// Runtime honesty per stage (REQ-013/014): what in-course practice may claim.
const STAGE_RUNTIMES = {
  JS: ['browser-js', 'local-web', 'concept-preview'],
  RE: ['browser-react', 'browser-js', 'local-web', 'concept-preview'],
  RN: ['browser-js', 'concept-preview', 'local-native', 'local-web'],
  NO: ['browser-js', 'browser-react', 'concept-preview', 'isolated-node', 'local-node', 'local-web', 'local-native'],
};
const STAGE_REQUIRED_RUNTIME = { RN: ['local-native'], NO: ['isolated-node', 'local-node'] };
const MAX_MINUTES = { instructional: 15, review: 45, assessment: 90, 'local-task': 60, 'capstone-step': 120 };

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// ---------- competencies ----------
const inventory = JSON.parse(readFileSync(join(root, 'docs', 'competencies.json'), 'utf8'));
const unitOrder = inventory.stage_order.flatMap((s) => inventory.unit_order[s]);
const unitPos = new Map(unitOrder.map((u, i) => [u, i]));
const families = new Map(inventory.competencies.map((c) => [c.id, c]));
const unitFamilies = new Map(unitOrder.map((u) => [u, new Set()]));
for (const c of inventory.competencies) for (const u of c.units) unitFamilies.get(u)?.add(c.id);

// ---------- load files ----------
const fileRe = /^(JS|RE|RN|NO)-\d{2}\.yaml$/;
const present = readdirSync(syllabusDir).filter((f) => fileRe.test(f)).sort();
const units = new Map(); // unit id -> parsed doc
for (const file of present) {
  const unitId = file.replace(/\.yaml$/, '');
  const text = readFileSync(join(syllabusDir, file), 'utf8');
  if (/\b(TODO|TBD|FIXME)\b/.test(text)) err(file, 'contains a TODO/TBD/FIXME placeholder');
  let doc;
  try {
    doc = YAML.parse(text);
  } catch (e) {
    err(file, `YAML parse error: ${e.message}`);
    continue;
  }
  if (!doc || typeof doc !== 'object') { err(file, 'empty document'); continue; }
  if (!unitPos.has(unitId)) { err(file, `unit ${unitId} is not in docs/competencies.json unit_order`); continue; }
  if (doc.unit !== unitId) err(file, `unit field "${doc.unit}" does not match file name`);
  units.set(unitId, doc);
}
if (!partial) {
  for (const u of unitOrder) if (!units.has(u)) err('syllabus', `missing unit file ${u}.yaml`);
}
const loadedUnits = unitOrder.filter((u) => units.has(u));

// ---------- helpers ----------
const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
function checkBilingual(where, v, label) {
  if (!v || typeof v !== 'object') return err(where, `${label} must be an object with uk and en`);
  for (const lang of ['uk', 'en']) if (!isNonEmpty(v[lang])) err(where, `${label}.${lang} is empty`);
  if (v.uk && !/[Ѐ-ӿ]/.test(v.uk)) warn(where, `${label}.uk contains no Cyrillic text`);
}
const idRe = (unit) => new RegExp(`^${unit.toLowerCase()}-(\\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$`);
const kebabRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------- pass 1: structure, build global lesson order ----------
const lessons = []; // { id, unit, idx (global), doc }
const lessonById = new Map();
for (const u of loadedUnits) {
  const doc = units.get(u);
  const where = `${u}.yaml`;
  const stage = u.slice(0, 2);
  if (doc.stage !== stage) err(where, `stage "${doc.stage}" must be ${stage}`);
  checkBilingual(where, doc.title, 'title');
  checkBilingual(where, doc.summary, 'summary');
  // competencies
  const mapped = unitFamilies.get(u);
  if (!Array.isArray(doc.competencies) || doc.competencies.length === 0) err(where, 'competencies must be a non-empty list');
  else {
    for (const f of doc.competencies) {
      if (!families.has(f)) err(where, `unknown competency family ${f}`);
      else if (!mapped.has(f)) err(where, `family ${f} is not mapped to ${u} in competencies.json`);
    }
    for (const f of mapped) if (!doc.competencies.includes(f)) err(where, `mapped family ${f} is missing from competencies`);
  }
  // capstone
  if (doc.capstoneStep === null || doc.capstoneStep === undefined) {
    if (doc.capstoneStep === undefined) err(where, 'capstoneStep must be an object or explicit null');
    checkBilingual(where, doc.capstoneStepReason, 'capstoneStepReason');
  } else {
    const cs = doc.capstoneStep;
    if (!CAPSTONE_MODES.includes(cs.mode)) err(where, `capstoneStep.mode must be one of ${CAPSTONE_MODES.join('|')}`);
    checkBilingual(where, cs.objective, 'capstoneStep.objective');
    if (!cs.variants || typeof cs.variants !== 'object') err(where, 'capstoneStep.variants missing');
    else {
      for (const d of DOMAINS) checkBilingual(where, cs.variants[d], `capstoneStep.variants.${d}`);
      for (const k of Object.keys(cs.variants)) if (!DOMAINS.includes(k)) err(where, `unknown capstone domain ${k}`);
    }
    if (doc.capstoneStepReason !== undefined) warn(where, 'capstoneStepReason is ignored when capstoneStep is set');
  }
  // lessons
  if (!Array.isArray(doc.lessons) || doc.lessons.length === 0) { err(where, 'lessons must be a non-empty list'); continue; }
  doc.lessons.forEach((L, i) => {
    const lid = typeof L?.id === 'string' ? L.id : `<lesson ${i + 1}>`;
    const lw = `${where} ${lid}`;
    const m = typeof L?.id === 'string' ? L.id.match(idRe(u)) : null;
    if (!m) err(lw, `id must match ${u.toLowerCase()}-NN-kebab-slug`);
    else if (Number(m[1]) !== i + 1) err(lw, `order number ${m[1]} must be ${String(i + 1).padStart(2, '0')}`);
    if (lessonById.has(lid)) err(lw, 'duplicate lesson id');
    const rec = { id: lid, unit: u, idx: lessons.length, doc: L };
    lessons.push(rec);
    lessonById.set(lid, rec);
  });
}

// ---------- pass 2: lesson contents ----------
const glossarySeen = new Map();
const subskillFirst = new Map(); // "fam|skill" -> { introIdx, assessIdx }
const difficultSeen = new Map();
const unitStats = new Map();
for (const rec of lessons) {
  const { id, unit, idx } = rec;
  const L = rec.doc;
  const where = `${unit}.yaml ${id}`;
  const stage = unit.slice(0, 2);
  const st = unitStats.get(unit) ?? { lessons: 0, minutes: 0, practice: new Set(), runtimes: new Set(), retrievalUnits: new Set(), retrievalCount: 0, kinds: {} };
  unitStats.set(unit, st);
  st.lessons++;
  checkBilingual(where, L.title, 'title');
  if (!LESSON_KINDS.includes(L.kind)) err(where, `kind must be one of ${LESSON_KINDS.join('|')}`);
  st.kinds[L.kind] = (st.kinds[L.kind] ?? 0) + 1;
  if (!Number.isInteger(L.minutes) || L.minutes < 5) err(where, 'minutes must be an integer >= 5');
  else {
    st.minutes += L.minutes;
    const max = MAX_MINUTES[L.kind] ?? 120;
    if (L.minutes > max) err(where, `minutes ${L.minutes} exceeds ${max} for kind ${L.kind}`);
  }
  if (!Array.isArray(L.objectives) || L.objectives.length === 0 || !L.objectives.every(isNonEmpty)) err(where, 'objectives must be a non-empty list of strings');
  if (!Array.isArray(L.misconceptions)) err(where, 'misconceptions must be a list');
  else {
    if (L.kind === 'instructional' && L.misconceptions.length === 0) err(where, 'instructional lesson needs at least one misconception');
    if (L.misconceptions.length > 3) err(where, 'at most three misconceptions per lesson');
    if (!L.misconceptions.every(isNonEmpty)) err(where, 'misconceptions must be non-empty strings');
  }
  // prerequisites
  if (!Array.isArray(L.prerequisites)) err(where, 'prerequisites must be a list');
  else {
    if (idx > 0 && L.prerequisites.length === 0 && !(partial && idx === 0)) err(where, 'every lesson after the first needs at least one prerequisite');
    for (const p of L.prerequisites) checkRef(where, p, 'prerequisite', idx, unit, false);
  }
  // glossary
  if (!Array.isArray(L.glossary)) err(where, 'glossary must be a list');
  else for (const g of L.glossary) {
    if (!kebabRe.test(String(g))) err(where, `glossary term "${g}" must be kebab-case`);
    if (glossarySeen.has(g)) err(where, `glossary term "${g}" already introduced in ${glossarySeen.get(g)}`);
    else glossarySeen.set(g, id);
  }
  // visual / analogy / difficult concept
  if (L.visual !== null && L.visual !== undefined) {
    if (!L.visual || typeof L.visual !== 'object') err(where, 'visual must be null or {kind, concept}');
    else {
      if (!VISUALS.includes(L.visual.kind)) err(where, `visual.kind must be one of ${VISUALS.join('|')}`);
      if (!isNonEmpty(L.visual.concept)) err(where, 'visual.concept is empty');
    }
  } else if (L.visual === undefined) err(where, 'visual must be present (object or null)');
  if (L.analogy !== null && L.analogy !== undefined) {
    if (!isNonEmpty(L.analogy)) err(where, 'analogy must be null or a non-empty string');
    else if (!/\(limit:/i.test(L.analogy)) err(where, 'analogy must state its limitation as "(limit: …)"');
  } else if (L.analogy === undefined) err(where, 'analogy must be present (string or null)');
  if (L.difficultConcept !== undefined && L.difficultConcept !== null) {
    if (!DIFFICULT.includes(L.difficultConcept)) err(where, `difficultConcept must be one of ${DIFFICULT.join('|')}`);
    else difficultSeen.set(L.difficultConcept, [...(difficultSeen.get(L.difficultConcept) ?? []), id]);
    if (!L.visual) err(where, 'a difficult-concept lesson needs a visual step-through');
    if (!isNonEmpty(L.analogy)) err(where, 'a difficult-concept lesson needs a bounded analogy');
  }
  // practice
  const kinds = new Set();
  if (!Array.isArray(L.practice) || L.practice.length === 0) err(where, 'practice must be a non-empty list');
  else for (const p of L.practice) {
    if (!PRACTICE_KINDS.includes(p?.kind)) err(where, `practice.kind "${p?.kind}" must be one of ${PRACTICE_KINDS.join('|')}`);
    if (!RUNTIMES.includes(p?.runtime)) err(where, `practice.runtime "${p?.runtime}" must be one of ${RUNTIMES.join('|')}`);
    else if (!STAGE_RUNTIMES[stage].includes(p.runtime)) err(where, `runtime ${p.runtime} is not honest for stage ${stage} (allowed: ${STAGE_RUNTIMES[stage].join(', ')})`);
    if (!isNonEmpty(p?.summary)) err(where, 'practice.summary is empty');
    kinds.add(p?.kind);
    st.practice.add(p?.kind);
    st.runtimes.add(p?.runtime);
  }
  if (L.kind === 'capstone-step') {
    const mode = units.get(unit).capstoneStep?.mode;
    const rts = (L.practice ?? []).map((p) => p?.runtime);
    if (mode === 'local' && !rts.some((r) => typeof r === 'string' && r.startsWith('local-'))) err(where, 'capstone step in a mode: local unit needs a local-web/local-native/local-node practice entry (the project lives in VS Code after CP-JS)');
    if (mode === 'in-platform' && !rts.some((r) => r === 'browser-js' || r === 'browser-react')) err(where, 'capstone step in a mode: in-platform unit needs an in-platform (browser-*) practice entry');
    if (!mode) err(where, 'capstone-step lesson in a unit with capstoneStep: null');
  }
  if (L.kind === 'instructional') {
    if (!kinds.has('predict')) err(where, 'instructional lesson needs a predict step (explanation → prediction → run/change → practice)');
    if (!kinds.has('run-change')) err(where, 'instructional lesson needs a run-change step');
    if (!['write', 'debug', 'independent', 'local-task'].some((k) => kinds.has(k))) err(where, 'instructional lesson needs focused practice (write/debug/independent/local-task)');
  }
  // subskills
  let hasAssess = false;
  if (!Array.isArray(L.subskills)) err(where, 'subskills must be a list');
  else for (const s of L.subskills) {
    const fam = families.get(s?.family);
    if (!fam) { err(where, `unknown family ${s?.family}`); continue; }
    if (!fam.subskills.includes(s.skill)) { err(where, `family ${s.family} has no subskill "${s.skill}"`); continue; }
    if (!DEPTHS.includes(s.depth)) { err(where, `depth "${s.depth}" must be one of ${DEPTHS.join('|')}`); continue; }
    if (!unitFamilies.get(unit).has(s.family)) err(where, `family ${s.family} is not mapped to unit ${unit}`);
    if (!units.get(unit).competencies?.includes(s.family)) err(where, `family ${s.family} is missing from the unit's competencies list`);
    const key = `${s.family}|${s.skill}`;
    const f = subskillFirst.get(key) ?? { introIdx: null, assessIdx: null };
    if (s.depth === 'assess') { hasAssess = true; if (f.assessIdx === null) f.assessIdx = idx; }
    else if (f.introIdx === null) f.introIdx = idx;
    subskillFirst.set(key, f);
  }
  if (hasAssess && !(kinds.has('independent') || kinds.has('debug'))) err(where, 'a lesson that assesses a subskill needs an independent or debug practice entry');
  // retrieval
  if (!Array.isArray(L.retrieval)) err(where, 'retrieval must be a list');
  else for (const r of L.retrieval) {
    if (!isNonEmpty(r?.concept)) err(where, 'retrieval.concept is empty');
    const srcUnit = checkRef(where, r?.from, 'retrieval.from', idx, unit, true);
    if (srcUnit && srcUnit !== unit) { st.retrievalUnits.add(srcUnit); st.retrievalCount++; }
  }
}

function checkRef(where, ref, label, idx, unit, requireEarlierUnit) {
  if (!isNonEmpty(ref)) { err(where, `${label} must be a lesson id`); return null; }
  const target = lessonById.get(ref);
  const refUnit = ref.slice(0, 5).toUpperCase();
  if (!target) {
    if (partial && unitPos.has(refUnit) && !units.has(refUnit)) {
      if (unitPos.get(refUnit) >= unitPos.get(unit)) err(where, `${label} ${ref} points to a unit that is not earlier in teaching order`);
      else warn(where, `${label} ${ref} is in a unit not loaded (partial run)`);
      return refUnit;
    }
    err(where, `${label} ${ref} is not a known lesson id`);
    return null;
  }
  if (target.idx >= idx) err(where, `${label} ${ref} must come earlier in teaching order`);
  if (requireEarlierUnit && target.unit === unit) warn(where, `${label} ${ref} is in the same unit; retrieval should reach back to earlier units`);
  return target.unit;
}

// ---------- pass 3: per-unit rules ----------
for (const u of loadedUnits) {
  const st = unitStats.get(u);
  if (!st) continue;
  const where = `${u}.yaml`;
  for (const k of ['predict', 'write', 'debug', 'independent']) if (!st.practice.has(k)) err(where, `unit has no ${k} practice entry`);
  const pos = unitPos.get(u);
  if (pos > 0) {
    if (st.retrievalCount < 2) err(where, `unit needs at least two retrieval entries from earlier units (has ${st.retrievalCount})`);
    if (pos >= 2 && st.retrievalUnits.size < 2) err(where, 'retrieval must reach at least two different earlier units (one recent, one distant)');
  }
  const stage = u.slice(0, 2);
  const required = STAGE_REQUIRED_RUNTIME[stage];
  if (required && !required.some((r) => st.runtimes.has(r))) err(where, `stage ${stage} unit needs real practice on ${required.join(' or ')} (runtime honesty)`);
}

// ---------- pass 4: same-unit foundations at lesson level ----------
for (const c of inventory.competencies) {
  for (const g of c.intro_same_unit_foundations ?? []) {
    const firstUnit = [...c.units].sort((a, b) => unitPos.get(a) - unitPos.get(b))[0];
    if (!units.has(firstUnit)) continue;
    const firstOf = (fam) => lessons.find((r) => r.unit === firstUnit && (r.doc.subskills ?? []).some((s) => s.family === fam));
    const fl = firstOf(c.id);
    const gl = firstOf(g);
    if (!fl || !gl) continue; // reported elsewhere if the family is absent
    if (gl.idx >= fl.idx) err(`${firstUnit}.yaml`, `${g} must be introduced before ${c.id} in the same unit (${gl.id} vs ${fl.id})`);
  }
}

// ---------- pass 5: closure ----------
let closed = 0;
let totalSubskills = 0;
if (!partial) {
  for (const c of inventory.competencies) {
    for (const skill of c.subskills) {
      totalSubskills++;
      const f = subskillFirst.get(`${c.id}|${skill}`);
      if (!f || f.introIdx === null) err('closure', `${c.id} "${skill}" is never introduced (intro/practice)`);
      if (!f || f.assessIdx === null) err('closure', `${c.id} "${skill}" is never assessed`);
      if (f && f.introIdx !== null && f.assessIdx !== null) {
        if (f.assessIdx <= f.introIdx) err('closure', `${c.id} "${skill}" is assessed (lesson #${f.assessIdx}) before or in the lesson that introduces it (#${f.introIdx})`);
        else closed++;
      }
    }
  }
  for (const d of DIFFICULT) if (!difficultSeen.has(d)) err('closure', `difficult concept ${d} has no lesson with difficultConcept set`);
}

// ---------- report ----------
if (!quiet) {
  console.log('Syllabus summary');
  console.log('----------------');
  const perStage = {};
  for (const u of loadedUnits) {
    const st = unitStats.get(u);
    if (!st) continue;
    const s = u.slice(0, 2);
    perStage[s] = perStage[s] ?? { units: 0, lessons: 0, minutes: 0 };
    perStage[s].units++; perStage[s].lessons += st.lessons; perStage[s].minutes += st.minutes;
    const kinds = Object.entries(st.kinds).map(([k, n]) => `${k}=${n}`).join(' ');
    console.log(`${u}: ${String(st.lessons).padStart(2)} lessons, ${String(st.minutes).padStart(4)} min  [${kinds}]`);
  }
  for (const s of STAGES) if (perStage[s]) console.log(`stage ${s}: ${perStage[s].units} units, ${perStage[s].lessons} lessons, ${perStage[s].minutes} min (${(perStage[s].minutes / 60).toFixed(1)} h)`);
  console.log(`total: ${loadedUnits.length} units, ${lessons.length} lessons, ${lessons.reduce((a, r) => a + (r.doc.minutes || 0), 0)} min`);
  console.log(`glossary terms: ${glossarySeen.size}`);
  if (!partial) console.log(`subskill closure: ${closed}/${totalSubskills} introduced before assessed`);
  console.log(`difficult concepts: ${DIFFICULT.map((d) => `${d}=${(difficultSeen.get(d) ?? []).length}`).join(' ')}`);
  const shownWarnings = warnings.filter(inScope);
  if (shownWarnings.length) { console.log(`\n${shownWarnings.length} warning(s):`); for (const w of shownWarnings) console.log(`  warn: ${w}`); }
}
if (errors.length) {
  const shown = errors.filter(inScope);
  console.error(`\n${errors.length} error(s)${only ? ` (${shown.length} in --only scope)` : ''}:`);
  for (const e of shown) console.error(`  error: ${e}`);
  process.exit(1);
}
console.log(`\nOK${partial ? ' (partial)' : ''}: ${lessons.length} lessons in ${loadedUnits.length} unit file(s), no errors.`);
