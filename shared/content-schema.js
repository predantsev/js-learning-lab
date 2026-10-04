// Content contract (see docs/CONTENT-DATA.md and content/README.md). Pure validation logic,
// shared by the compiler, the validator and unit tests. No I/O here.

export const LANGS = ['uk', 'en'];
export const STAGES = ['JS', 'RE', 'RN', 'NO'];
export const CAPSTONES = ['wishlist', 'planner', 'habits', 'expenses'];
export const LESSON_KINDS = ['instructional', 'review', 'assessment', 'local-task', 'capstone-step'];
export const BLOCK_KINDS = ['explanation', 'analogy', 'visual', 'prediction', 'example', 'exercise', 'transfer', 'local-task', 'review'];
/** Blocks that occupy the practice pane (right side); every such block ends a lesson page. */
export const WORKSPACE_BLOCK_KINDS = ['example', 'exercise'];
export const EXECUTABLE_RUNTIMES = ['browser-js', 'browser-react', 'concept-preview', 'isolated-node'];
export const LOCAL_RUNTIMES = ['local-web', 'local-native', 'local-node'];
export const RUNTIME_KINDS = [...EXECUTABLE_RUNTIMES, ...LOCAL_RUNTIMES];
/**
 * Runtime honesty per stage (REQ-013/014): the runtimes a lesson block or a syllabus practice entry
 * of each stage may declare. Shared by the content validator and scripts/content/validate-syllabus.mjs.
 * React Native units may also run computer-side Node.js (the supplied mock service of rn-06-01:
 * an `isolated-node` example and a `local-node` task); that is never native evidence, so every RN
 * unit still needs a `local-native` task (STAGE_REQUIRED_RUNTIMES). content/README.md, "Runtimes".
 */
export const STAGE_RUNTIMES = {
  JS: ['browser-js', 'local-web', 'concept-preview'],
  RE: ['browser-react', 'browser-js', 'local-web', 'concept-preview'],
  RN: ['browser-js', 'concept-preview', 'local-native', 'local-web', 'isolated-node', 'local-node'],
  NO: ['browser-js', 'browser-react', 'concept-preview', 'isolated-node', 'local-node', 'local-web', 'local-native'],
};
/** At least one practice entry of each unit of these stages uses one of these runtimes (syllabus). */
export const STAGE_REQUIRED_RUNTIMES = { RN: ['local-native'], NO: ['isolated-node', 'local-node'] };
export const EXERCISE_MODES = ['guided', 'debug', 'independent'];
export const PREDICTION_TYPES = ['choice', 'multi', 'text', 'order'];
export const VISUAL_KINDS = ['code-trace', 'memory-graph', 'pipeline', 'event-loop', 'diagram', 'sequence', 'git-graph', 'render-timeline'];
export const SUBSKILL_DEPTHS = ['intro', 'practice', 'assess'];

export const LESSON_ID_PATTERN = /^(js|re|rn|no)-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BLOCK_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const TERM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const GLOSSARY_LINK = /\[\[([a-z0-9-]+)(?:\\?\|([^\]]+))?\]\]/g;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

export const unitOfLesson = (lessonId) => lessonId.slice(0, 5).toUpperCase();

/**
 * Why an id field is not usable text, or null when it is a non-empty string. YAML reads an unquoted
 * `null`, `~`, `true` or `12` as a value of another type ("id: null" is no id at all), which is easy
 * to write for prediction options; the message names that cause.
 */
export function idProblem(value, label = 'id') {
  if (value === undefined) return `missing ${label}`;
  if (value === null) return `${label} is null (unquoted null or ~? YAML reads it as no value: quote it, ${label}: "null", or choose another id)`;
  if (typeof value !== 'string') return `${label} is the YAML ${typeof value} ${JSON.stringify(value)}, not text (unquoted? quote it: ${label}: "${String(value)}")`;
  if (value.trim() === '') return `${label} is empty`;
  return null;
}

/** Collects errors as { path, message }. */
export class Issues {
  constructor(prefix = '') {
    this.prefix = prefix;
    this.list = [];
  }
  add(path, message) {
    this.list.push({ path: this.prefix ? `${this.prefix}${path ? ` › ${path}` : ''}` : path, message });
  }
  get ok() {
    return this.list.length === 0;
  }
}

export function checkLocalized(issues, value, path, { optional = false } = {}) {
  if (value === undefined || value === null) {
    if (!optional) issues.add(path, 'missing bilingual text (needs uk and en)');
    return false;
  }
  if (!isPlainObject(value)) {
    issues.add(path, 'must be an object with "uk" and "en"');
    return false;
  }
  let ok = true;
  for (const lang of LANGS) {
    if (!nonEmpty(value[lang])) {
      issues.add(`${path}.${lang}`, 'missing or empty translation');
      ok = false;
    }
  }
  for (const key of Object.keys(value)) if (!LANGS.includes(key)) issues.add(`${path}.${key}`, 'unknown language key');
  return ok;
}

function collectLocalizedStrings(value, out = []) {
  if (isPlainObject(value)) {
    if (LANGS.every((l) => typeof value[l] === 'string')) out.push(value);
    else for (const v of Object.values(value)) collectLocalizedStrings(v, out);
  } else if (Array.isArray(value)) for (const v of value) collectLocalizedStrings(v, out);
  return out;
}

/** All glossary term ids referenced through [[term]] links anywhere in a lesson/block. */
export function glossaryRefs(value) {
  const refs = new Set();
  for (const loc of collectLocalizedStrings(value)) {
    for (const lang of LANGS) for (const m of loc[lang].matchAll(GLOSSARY_LINK)) refs.add(m[1]);
  }
  return refs;
}

function checkPredictionItem(issues, item, path) {
  checkLocalized(issues, item.prompt, `${path}.prompt`);
  checkLocalized(issues, item.explanation, `${path}.explanation`);
  if (item.code !== undefined && !nonEmpty(item.code)) issues.add(`${path}.code`, 'must be a non-empty string when present');
  const answer = item.answer;
  if (!isPlainObject(answer) || !PREDICTION_TYPES.includes(answer.type)) {
    issues.add(`${path}.answer.type`, `must be one of ${PREDICTION_TYPES.join(', ')}`);
    return;
  }
  if (answer.type === 'choice' || answer.type === 'multi') {
    if (!Array.isArray(answer.options) || answer.options.length < 2) issues.add(`${path}.answer.options`, 'needs at least two options');
    const ids = new Set();
    for (const [i, option] of (answer.options ?? []).entries()) {
      const optionIdProblem = idProblem(option.id);
      if (optionIdProblem) issues.add(`${path}.answer.options[${i}].id`, optionIdProblem);
      if (ids.has(option.id)) issues.add(`${path}.answer.options[${i}].id`, 'duplicate option id');
      ids.add(option.id);
      if (option.code === undefined) checkLocalized(issues, option.text, `${path}.answer.options[${i}].text`);
      else if (!nonEmpty(String(option.code))) issues.add(`${path}.answer.options[${i}].code`, 'empty code option');
      if (option.why !== undefined) checkLocalized(issues, option.why, `${path}.answer.options[${i}].why`);
    }
    const correct = answer.correct;
    if (!Array.isArray(correct) || correct.length === 0) issues.add(`${path}.answer.correct`, 'must list the correct option id(s)');
    else {
      if (answer.type === 'choice' && correct.length !== 1) issues.add(`${path}.answer.correct`, 'a single-choice question has exactly one correct option');
      for (const id of correct) if (!ids.has(id)) issues.add(`${path}.answer.correct`, `unknown option id "${id}"`);
    }
  } else if (answer.type === 'text') {
    if (!Array.isArray(answer.accept) || answer.accept.length === 0 || !answer.accept.every((a) => typeof a === 'string')) issues.add(`${path}.answer.accept`, 'must list accepted answers as strings');
  } else if (answer.type === 'order') {
    if (!Array.isArray(answer.items) || answer.items.length < 2) issues.add(`${path}.answer.items`, 'needs at least two items listed in the correct order');
    for (const [i, it] of (answer.items ?? []).entries()) {
      if (it.code === undefined) checkLocalized(issues, it.text, `${path}.answer.items[${i}].text`);
    }
  }
  // `code` and `verify` belong to the question itself (a prediction block or a review item), next to
  // `prompt` — not inside `answer`, where they would be ignored.
  for (const key of ['code', 'verify']) if (isPlainObject(answer) && answer[key] !== undefined) issues.add(`${path}.answer.${key}`, `"${key}" belongs to the question, next to "prompt", not inside "answer"`);
  if (item.verify !== undefined) {
    if (!isPlainObject(item.verify) || !Array.isArray(item.verify.logs)) issues.add(`${path}.verify.logs`, 'must list the exact console lines the code prints');
    if (!nonEmpty(item.code)) issues.add(`${path}.verify`, 'verify runs this question\'s own "code" field (as in a prediction), and this question has no code: add the code the learner reads, or remove verify');
  }
}

function checkStrings(issues, block, p) {
  if (block.strings === undefined) return;
  if (!isPlainObject(block.strings)) { issues.add(`${p}.strings`, 'must map keys to bilingual text'); return; }
  for (const [key, value] of Object.entries(block.strings)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) issues.add(`${p}.strings.${key}`, 'keys use letters, digits and underscores');
    checkLocalized(issues, value, `${p}.strings.${key}`);
  }
}

/** isolated-node capabilities map one to one to the executor request (docs/platform/SERVER-API.md). */
function checkNodeCapabilities(issues, caps, p) {
  if (caps === undefined) return;
  if (!isPlainObject(caps)) {
    issues.add(p, 'must be a mapping');
    return;
  }
  const allowed = ['network', 'workers', 'timeoutMs', 'testTimeoutMs'];
  for (const key of Object.keys(caps)) if (!allowed.includes(key)) issues.add(`${p}.${key}`, `unknown capability for isolated-node (allowed: ${allowed.join(', ')})`);
  if (caps.network !== undefined && caps.network !== 'none' && caps.network !== 'loopback') issues.add(`${p}.network`, 'must be "none" (default) or "loopback" for isolated-node');
  if (caps.workers !== undefined && typeof caps.workers !== 'boolean') issues.add(`${p}.workers`, 'must be true or false');
  if (caps.timeoutMs !== undefined && !(Number.isInteger(caps.timeoutMs) && caps.timeoutMs >= 100 && caps.timeoutMs <= 60000)) issues.add(`${p}.timeoutMs`, 'must be a whole number of milliseconds between 100 and 60000');
  if (caps.testTimeoutMs !== undefined && !(Number.isInteger(caps.testTimeoutMs) && caps.testTimeoutMs >= 50 && caps.testTimeoutMs <= 30000)) issues.add(`${p}.testTimeoutMs`, 'must be a whole number of milliseconds between 50 and 30000');
}

function checkBlock(issues, block, lesson, ctx) {
  const p = `block "${block.id}"`;
  checkStrings(issues, block, p);
  if (!BLOCK_KINDS.includes(block.kind)) {
    issues.add(p, `unknown block kind "${block.kind}"`);
    return;
  }
  if (block.title !== undefined) checkLocalized(issues, block.title, `${p}.title`);
  const stage = typeof lesson.id === 'string' ? lesson.id.slice(0, 2).toUpperCase() : null;
  if (['example', 'exercise', 'local-task'].includes(block.kind) && RUNTIME_KINDS.includes(block.runtime) && STAGE_RUNTIMES[stage] && !STAGE_RUNTIMES[stage].includes(block.runtime)) {
    issues.add(`${p}.runtime`, `runtime ${block.runtime} is not honest for stage ${stage} (allowed: ${STAGE_RUNTIMES[stage].join(', ')}; content/README.md, "Runtimes")`);
  }
  switch (block.kind) {
    case 'explanation':
      checkLocalized(issues, block.title, `${p}.title`);
      checkLocalized(issues, block.body, `${p}.body`);
      break;
    case 'analogy':
      checkLocalized(issues, block.body, `${p}.body`);
      checkLocalized(issues, block.limits, `${p}.limits`);
      break;
    case 'visual':
      if (!VISUAL_KINDS.includes(block.visual)) issues.add(`${p}.visual`, `must be one of ${VISUAL_KINDS.join(', ')}`);
      checkLocalized(issues, block.title, `${p}.title`);
      checkLocalized(issues, block.textEquivalent, `${p}.textEquivalent`);
      if (!isPlainObject(block.spec)) issues.add(`${p}.spec`, 'missing visual spec');
      break;
    case 'prediction':
      checkPredictionItem(issues, block, p);
      break;
    case 'review':
      checkLocalized(issues, block.title, `${p}.title`);
      if (!Array.isArray(block.items) || block.items.length === 0) issues.add(`${p}.items`, 'a review block needs at least one question');
      for (const [i, item] of (block.items ?? []).entries()) {
        checkPredictionItem(issues, item, `${p}.items[${i}]`);
        if (item.strings !== undefined) issues.add(`${p}.items[${i}].strings`, 'put strings on the review block: its questions share one table');
        const itemIdProblem = idProblem(item.id);
        if (itemIdProblem) issues.add(`${p}.items[${i}].id`, itemIdProblem);
        else if (!BLOCK_ID_PATTERN.test(item.id)) issues.add(`${p}.items[${i}].id`, `invalid id "${item.id}" (kebab-case: lowercase letters, digits and dashes, starting with a letter)`);
        if (!nonEmpty(item.from) || !LESSON_ID_PATTERN.test(item.from)) issues.add(`${p}.items[${i}].from`, 'must name the earlier lesson id this question retrieves');
        else if (ctx.lessonOrder && ctx.lessonOrder.has(item.from) && ctx.lessonOrder.has(lesson.id) && ctx.lessonOrder.get(item.from) >= ctx.lessonOrder.get(lesson.id)) issues.add(`${p}.items[${i}].from`, 'must be an earlier lesson');
      }
      break;
    case 'example':
    case 'exercise': {
      checkLocalized(issues, block.title, `${p}.title`);
      if (!EXECUTABLE_RUNTIMES.includes(block.runtime)) issues.add(`${p}.runtime`, `must be one of ${EXECUTABLE_RUNTIMES.join(', ')}`);
      if (!nonEmpty(block.dir)) issues.add(`${p}.dir`, 'missing directory with the block files');
      if (!nonEmpty(block.entry)) issues.add(`${p}.entry`, 'missing entry file');
      if (block.runtime === 'concept-preview') checkLocalized(issues, block.limits, `${p}.limits`);
      if (block.limits !== undefined && block.runtime !== 'concept-preview') checkLocalized(issues, block.limits, `${p}.limits`);
      if (block.runtime === 'isolated-node') checkNodeCapabilities(issues, block.capabilities, `${p}.capabilities`);
      if (block.kind === 'example') {
        checkLocalized(issues, block.body, `${p}.body`);
        if (block.tryIt !== undefined) checkLocalized(issues, block.tryIt, `${p}.tryIt`);
      } else {
        checkLocalized(issues, block.instructions, `${p}.instructions`);
        if (!EXERCISE_MODES.includes(block.mode)) issues.add(`${p}.mode`, `must be one of ${EXERCISE_MODES.join(', ')}`);
        if (block.mode === 'independent') {
          if (block.hints !== undefined) issues.add(`${p}.hints`, 'independent exercises have no hints');
        } else {
          checkLocalized(issues, block.hints?.nudge, `${p}.hints.nudge`);
          checkLocalized(issues, block.hints?.explanation, `${p}.hints.explanation`);
        }
        checkLocalized(issues, block.solutionNote, `${p}.solutionNote`);
        if (!isPlainObject(block.testTitles) || Object.keys(block.testTitles).length === 0) issues.add(`${p}.testTitles`, 'must map every test name to a bilingual title');
        else for (const [name, title] of Object.entries(block.testTitles)) checkLocalized(issues, title, `${p}.testTitles["${name}"]`);
        for (const [i, rule] of (block.feedback ?? []).entries()) {
          if (!isPlainObject(rule.when) || !(nonEmpty(rule.when.test) || nonEmpty(rule.when.error))) issues.add(`${p}.feedback[${i}].when`, 'needs "test" (test name) or "error" (error name)');
          checkLocalized(issues, rule.message, `${p}.feedback[${i}].message`);
        }
      }
      break;
    }
    case 'transfer':
      checkLocalized(issues, block.body, `${p}.body`);
      if (!nonEmpty(block.capstoneStep) && !nonEmpty(block.checkpoint)) issues.add(p, 'needs "capstoneStep" (unit id of the step) or "checkpoint" (CP id) to link to');
      break;
    case 'local-task': {
      checkLocalized(issues, block.title, `${p}.title`);
      checkLocalized(issues, block.intro, `${p}.intro`);
      if (!LOCAL_RUNTIMES.includes(block.runtime)) issues.add(`${p}.runtime`, `must be one of ${LOCAL_RUNTIMES.join(', ')}`);
      if (!Array.isArray(block.tools) || block.tools.length === 0) issues.add(`${p}.tools`, 'list required tools with versions');
      for (const [i, tool] of (Array.isArray(block.tools) ? block.tools : []).entries()) {
        if (!isPlainObject(tool) || tool.name === undefined || tool.name === null) { issues.add(`${p}.tools[${i}].name`, 'needs the tool name'); continue; }
        // A product name is the same text in both languages ("Node.js"); a described tool ("A code
        // editor") is bilingual text.
        if (!nonEmpty(tool.name)) checkLocalized(issues, tool.name, `${p}.tools[${i}].name`);
        // A version is the same text in both languages ("22.13 or newer" is not) — or bilingual text.
        if (tool.version !== undefined && !nonEmpty(tool.version)) checkLocalized(issues, tool.version, `${p}.tools[${i}].version`);
        if (tool.note !== undefined) checkLocalized(issues, tool.note, `${p}.tools[${i}].note`);
      }
      if (!Array.isArray(block.steps) || block.steps.length === 0) issues.add(`${p}.steps`, 'needs ordered steps');
      for (const [i, step] of (block.steps ?? []).entries()) {
        checkLocalized(issues, step.text, `${p}.steps[${i}].text`);
        if (step.expect !== undefined) checkLocalized(issues, step.expect, `${p}.steps[${i}].expect`);
      }
      if (!Array.isArray(block.verify) || block.verify.length === 0) issues.add(`${p}.verify`, 'needs at least one verification item the learner confirms');
      for (const [i, v] of (block.verify ?? []).entries()) {
        const verifyIdProblem = idProblem(v?.id);
        if (verifyIdProblem) issues.add(`${p}.verify[${i}].id`, verifyIdProblem);
        checkLocalized(issues, v.text, `${p}.verify[${i}].text`);
      }
      if (!Array.isArray(block.troubleshooting) || block.troubleshooting.length === 0) issues.add(`${p}.troubleshooting`, 'needs common failure causes with fixes');
      for (const [i, t] of (block.troubleshooting ?? []).entries()) {
        checkLocalized(issues, t.problem, `${p}.troubleshooting[${i}].problem`);
        checkLocalized(issues, t.fix, `${p}.troubleshooting[${i}].fix`);
      }
      checkLocalized(issues, block.recovery, `${p}.recovery`);
      break;
    }
    default:
      break;
  }
}

/**
 * Static validation of one lesson source object (parsed lesson.yaml).
 * ctx: { glossary:Set<string>|null, lessonOrder:Map<lessonId,index>|null, syllabus: lesson spine entry|null, competencies: Map<family, {subskills:Set, units:Set}>|null }
 */
export function validateLessonSource(lesson, ctx = {}) {
  const issues = new Issues(`lesson ${lesson?.id ?? '(no id)'}`);
  if (!isPlainObject(lesson)) {
    issues.add('', 'lesson.yaml must contain a mapping');
    return issues;
  }
  const lessonIdProblem = idProblem(lesson.id);
  if (lessonIdProblem) issues.add('id', lessonIdProblem);
  else if (!LESSON_ID_PATTERN.test(lesson.id)) issues.add('id', 'must match <stage>-<unit nn>-<order nn>-<slug>, for example js-05-03-filter');
  if (!nonEmpty(lesson.unit) || (nonEmpty(lesson.id) && unitOfLesson(lesson.id) !== lesson.unit)) issues.add('unit', 'must equal the unit encoded in the lesson id (for example JS-05)');
  checkLocalized(issues, lesson.title, 'title');
  if (!LESSON_KINDS.includes(lesson.kind)) issues.add('kind', `must be one of ${LESSON_KINDS.join(', ')}`);
  if (!Number.isInteger(lesson.minutes) || lesson.minutes < 3 || lesson.minutes > 90) issues.add('minutes', 'must be a whole number of minutes');
  if (lesson.kind === 'instructional' && Number.isInteger(lesson.minutes) && (lesson.minutes < 5 || lesson.minutes > 15)) issues.add('minutes', 'instructional lessons take 5–15 minutes; split longer ones');
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length === 0) issues.add('objectives', 'needs at least one objective');
  for (const [i, o] of (lesson.objectives ?? []).entries()) checkLocalized(issues, o, `objectives[${i}]`);
  if (lesson.kind !== 'instructional') checkLocalized(issues, lesson.purpose, 'purpose');
  if (!Number.isInteger(lesson.contentVersion) || lesson.contentVersion < 1) issues.add('contentVersion', 'must be a positive integer');
  for (const pre of lesson.prerequisites ?? []) {
    if (!LESSON_ID_PATTERN.test(String(pre))) issues.add('prerequisites', `"${pre}" is not a lesson id`);
    else if (ctx.lessonOrder) {
      if (!ctx.lessonOrder.has(pre)) issues.add('prerequisites', `unknown lesson "${pre}"`);
      else if (ctx.lessonOrder.has(lesson.id) && ctx.lessonOrder.get(pre) >= ctx.lessonOrder.get(lesson.id)) issues.add('prerequisites', `"${pre}" is not earlier in teaching order`);
    }
  }
  if (!Array.isArray(lesson.subskills)) issues.add('subskills', 'list the competency subskills this lesson teaches or assesses (an empty list is allowed for orientation lessons)');
  for (const [i, s] of (lesson.subskills ?? []).entries()) {
    if (!isPlainObject(s) || !nonEmpty(s.family) || !nonEmpty(s.skill) || !SUBSKILL_DEPTHS.includes(s.depth)) {
      issues.add(`subskills[${i}]`, 'needs { family, skill, depth: intro|practice|assess }');
      continue;
    }
    if (ctx.competencies) {
      const fam = ctx.competencies.get(s.family);
      if (!fam) issues.add(`subskills[${i}].family`, `unknown competency family "${s.family}"`);
      else if (!fam.subskills.has(s.skill)) issues.add(`subskills[${i}].skill`, `"${s.skill}" is not a subskill of ${s.family} (use the exact string from docs/competencies.json)`);
    }
  }

  const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : [];
  if (blocks.length === 0) issues.add('blocks', 'a lesson needs blocks');
  const ids = new Set();
  for (const [i, block] of blocks.entries()) {
    if (!isPlainObject(block)) {
      issues.add(`blocks[${i}]`, 'each block must be a mapping');
      continue;
    }
    const blockIdProblem = idProblem(block.id);
    if (blockIdProblem) issues.add(`blocks[${i}].id`, blockIdProblem);
    else if (!BLOCK_ID_PATTERN.test(block.id)) issues.add(`blocks[${i}].id`, `invalid block id "${block.id}" (kebab-case: lowercase letters, digits and dashes, starting with a letter)`);
    if (ids.has(block.id)) issues.add('blocks', `duplicate block id "${block.id}"`);
    ids.add(block.id);
    checkBlock(issues, block, lesson, ctx);
  }

  const count = (kind, pred = () => true) => blocks.filter((b) => b.kind === kind && pred(b)).length;
  if (lesson.kind === 'instructional') {
    // REQ-005: explanation → prediction → real run/change → independent practice → transfer.
    if (count('explanation') === 0) issues.add('blocks', 'instructional lessons start from an explanation');
    if (count('prediction') === 0) issues.add('blocks', 'instructional lessons include a prediction before running code');
    if (count('example') + count('exercise') === 0) issues.add('blocks', 'instructional lessons include real code to run and change');
    if (count('exercise') === 0) issues.add('blocks', 'instructional lessons include an exercise');
    if (count('transfer') === 0) issues.add('blocks', 'instructional lessons end with a capstone transfer block (or a link to the next checkpoint)');
    const firstExplanation = blocks.findIndex((b) => b.kind === 'explanation');
    const firstWorkspace = blocks.findIndex((b) => WORKSPACE_BLOCK_KINDS.includes(b.kind));
    if (firstWorkspace !== -1 && firstExplanation > firstWorkspace) issues.add('blocks', 'the first explanation must come before practice');
  }
  if (lesson.selfCheck !== undefined) {
    if (!Array.isArray(lesson.selfCheck) || lesson.selfCheck.length === 0) issues.add('selfCheck', 'list block ids used for the optional skip self-check');
    for (const id of lesson.selfCheck ?? []) {
      const b = blocks.find((x) => x.id === id);
      if (!b) issues.add('selfCheck', `unknown block "${id}"`);
      else if (!['prediction', 'exercise'].includes(b.kind)) issues.add('selfCheck', `block "${id}" must be a prediction or an exercise`);
    }
  } else if (lesson.kind === 'instructional') issues.add('selfCheck', 'instructional lessons name 1–3 blocks for the optional "I know this" self-check');

  if (ctx.glossary) for (const ref of glossaryRefs(lesson)) if (!ctx.glossary.has(ref)) issues.add('glossary', `[[${ref}]] is not a glossary term`);
  for (const term of lesson.glossary ?? []) if (ctx.glossary && !ctx.glossary.has(term)) issues.add('glossary', `introduced term "${term}" is missing from content/glossary`);
  return issues;
}

export function validateGlossaryTerm(term) {
  const issues = new Issues(`glossary ${term?.id ?? '(no id)'}`);
  const termIdProblem = idProblem(term.id);
  if (termIdProblem) issues.add('id', termIdProblem);
  else if (!TERM_ID_PATTERN.test(term.id)) issues.add('id', 'must be kebab-case English');
  if (!nonEmpty(term.term)) issues.add('term', 'missing canonical English technical name');
  checkLocalized(issues, term.definition, 'definition');
  if (term.name !== undefined) checkLocalized(issues, term.name, 'name');
  if (term.context !== undefined) checkLocalized(issues, term.context, 'context');
  if (term.example !== undefined && !nonEmpty(term.example.code)) issues.add('example.code', 'empty example');
  return issues;
}

/** Pages: blocks are read top to bottom; every workspace block closes the current page. */
export function paginate(blocks) {
  const pages = [];
  let current = [];
  for (const block of blocks) {
    current.push(block.id);
    if (WORKSPACE_BLOCK_KINDS.includes(block.kind)) {
      pages.push(current);
      current = [];
    }
  }
  if (current.length > 0) pages.push(current);
  return pages;
}
