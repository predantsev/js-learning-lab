// Checks of capstone step JS-14, habits variant: domain/habits.ts and storage/habits.ts replace the
// .js modules and every import names a file that exists (as Node.js resolves it); tsconfig.json asks
// for strict checking; the rules behave as before; isUsableHabit checks an unknown value field by
// field, loadHabits refuses a repeated id, and indexById is generic. The learner's domain tests import
// the .ts module and catch an indexById that keeps the last of a repeated id.
//
// Types are not checked here: the platform removes them before running, as Node.js does, and only
// tsc in the exported project checks them. The checks observe behaviour. The learner's suite runs
// again with swapped modules (the course's domain module with its types removed, the course runner),
// with every global of this harness hidden.
const KEY = 'jsll.habits.v1';
const BACKUP = 'jsll.habits.v1.backup';
const DOMAIN = 'domain/habits.ts';
const STORAGE = 'storage/habits.ts';
const SWAP = DOMAIN;
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#habits';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
// The course's domain module with its types removed (a browser cannot run TypeScript from a blob).
const CORRECT = fill("// The rules of a habit: pure functions with types. No page and no storage here; the starting\n// habits are in data/habits.json. The types exist only for tsc: the platform and Node.js remove them\n// before running, so a value that comes from outside (storage, a file) is still checked at runtime.\n\n// ---------- types ----------\n\n                                           \n\n                     \n                      \n               \n                       \n                  \n                                                                                      \n  \n\n// A draft from the form: every field may be missing, and a frequency is any text until it is checked.\n                          \n                \n                     \n                   \n  \n\n                                                                \n\n                           \n                       \n                            \n  \n\n// The result of validateHabit: exactly one of the two shapes; `ok` tells them apart.\n                              \n                                                               \n                                       \n\n                                              \n\n                                                           \n\n// ---------- rules ----------\n\n// The word for a frequency value.\nexport function frequencyText(frequency           )         {\n  switch (frequency) {\n    case \"daily\":\n      return \"%%daily%%\";\n    case \"weekly\":\n      return \"%%weekly%%\";\n    default:\n      return \"\";\n  }\n}\n\n// The label of a habit: the name, the frequency in words, and a mark when the habit is paused.\nexport function formatHabitLabel(habit       )         {\n  const label = habit.name + \" · \" + frequencyText(habit.frequency);\n  if (habit.active === false) {\n    return label + \" · %%pausedMark%%\";\n  }\n  return label;\n}\n\n// A type predicate: true only for the two known frequencies, and then tsc treats the text as a\n// Frequency.\nexport function isFrequency(value         )                     {\n  return value === \"daily\" || value === \"weekly\";\n}\n\n// Checks a draft habit. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateHabit(input            )                   {\n  const errors              = {};\n\n  const name = (input.name ?? \"\").trim();\n  if (name === \"\") {\n    errors.name = \"required\";\n  } else if (name.length > 80) {\n    errors.name = \"too-long\";\n  }\n\n  // A missing frequency is \"daily\"; any other text than the two frequencies is unknown.\n  const frequency = input.frequency ?? \"daily\";\n  if (!isFrequency(frequency)) {\n    errors.frequency = \"unknown\";\n  }\n\n  // !isFrequency(frequency) is checked here again so that tsc knows the frequency below is a Frequency.\n  if (errors.name !== undefined || !isFrequency(frequency)) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { name: name, frequency: frequency } };\n}\n\n// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.\n// Every new habit gets its own, new completions array; the draft may also carry the active flag.\nexport function addHabit(list         , id        , input            )          {\n  const check = validateHabit(input);\n  if (!check.ok) {\n    return list;\n  }\n  const habit        = { id: id, name: check.value.name, frequency: check.value.frequency, active: input.active ?? true, completions: [] };\n  return [...list, habit];\n}\n\n// A new list in which the habit with this id is replaced by a copy with the changes;\n// the other habits are the same objects.\nexport function updateHabit(list         , id        , changes                            )          {\n  const result          = [];\n  for (const habit of list) {\n    if (habit.id === id) {\n      result.push({ ...habit, ...changes });\n    } else {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A new list without the habit with this id.\nexport function removeHabit(list         , id        )          {\n  const result          = [];\n  for (const habit of list) {\n    if (habit.id !== id) {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A calendar date is text of exactly the form \"YYYY-MM-DD\": the anchors ^ and $ refuse anything\n// before or after it, such as a time.\nexport function isCalendarDate(value         )                  {\n  return typeof value === \"string\" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value);\n}\n\n// The days without repeats, in ascending order. A Set keeps every day once; \"YYYY-MM-DD\" text\n// sorts in the same order as the dates.\nexport function uniqueSortedDays(days                   )           {\n  return sortBy([...new Set(days)], (day) => day);\n}\n\n// A generic sorted copy: the records in the order of the text that `key` gives for each, compared\n// with localeCompare; records with the same key keep their order (the sort is stable). It works for\n// habits, dates or any other records, and the result has the same type as the input.\nexport function sortBy   (items              , key                     )      {\n  return items.toSorted((a, b) => key(a).localeCompare(key(b)));\n}\n\n// A new list in which the habit with this id has the day in a NEW completions array. The dates\n// stay unique and sorted, so an earlier day lands in its place. A day that is already there, or\n// text that is not a calendar date, changes nothing.\nexport function completeHabit(list         , id        , day        )          {\n  if (!isCalendarDate(day)) {\n    return list;\n  }\n  const result          = [];\n  for (const habit of list) {\n    if (habit.id !== id || habit.completions.includes(day)) {\n      result.push(habit);\n    } else {\n      result.push({ ...habit, completions: uniqueSortedDays([...habit.completions, day]) });\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text        )         {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The habits whose name contains the query; both sides are compared by their search key. An empty\n// query keeps every habit.\nexport function searchHabits(list         , query        )          {\n  const wanted = searchKey(query);\n  return list.filter((habit) => searchKey(habit.name).includes(wanted));\n}\n\n// The active (\"active\") or the paused (\"paused\") habits.\nexport function filterHabits(list         , status             )          {\n  const active = status === \"active\";\n  return list.filter((habit) => habit.active === active);\n}\n\n// A copy in the alphabetical order of the names; equal names keep their order, and the received\n// list keeps its order.\nexport function sortHabitsByName(list         )          {\n  return sortBy(list, (habit) => habit.name);\n}\n\n// On how many of the given days the habit was completed, and which share of the days that is.\n// No days means no share: the rate is 0, not NaN.\nexport function summarizeHabit(habit       , days                   )               {\n  const count = days.filter((day) => habit.completions.includes(day)).length;\n  return { count: count, rate: days.length === 0 ? 0 : count / days.length };\n}\n\n// The names of the habits of a list, each with its completion rate over the days in percent.\nexport function formatRates(list         , days                   )         {\n  let text = \"\";\n  for (const habit of list) {\n    if (text !== \"\") {\n      text = text + \"; \";\n    }\n    text = text + habit.name + \" — \" + summarizeHabit(habit, days).rate * 100 + \"%\";\n  }\n  return text;\n}\n\n// An index by id: a Map from id to record, so a record is found without a pass over the list. It\n// is generic: it works for any records with a text id, and the Map keeps their type. If two\n// records share an id, the first one stays in the index.\nexport function indexById                                   (list              )                 {\n  const index = new Map           ();\n  for (const item of list) {\n    if (!index.has(item.id)) {\n      index.set(item.id, item);\n    }\n  }\n  return index;\n}\n\n// The items in pages of `size`, one page at a time: the generator builds a page only when the next\n// one is asked for, so a page that is never shown is never built. An empty list yields no page.\nexport function* paginate   (items              , size        )                 {\n  for (let start = 0; start < items.length; start += size) {\n    yield items.slice(start, start + size);\n  }\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  indexKeepsLast: broken('    if (!index.has(item.id)) {\n      index.set(item.id, item);\n    }', '    index.set(item.id, item);'),
};
const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
const good = () => ({ id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] });
const without = (field) => {
  const record = good();
  delete record[field];
  return record;
};
const saved = (records) => JSON.stringify({ schemaVersion: 1, records });
/** The relative imports of a project file that point at no file of the project (as Node.js resolves them: no .js → .ts). */
function missingImports(entry, seen = new Set(), missing = []) {
  if (seen.has(entry) || typeof files[entry] !== 'string') return missing;
  seen.add(entry);
  for (const match of files[entry].matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\1/g)) {
    const target = resolvePath(entry, match[2]);
    if (typeof files[target] !== 'string') missing.push(`${entry} → ${match[2]}`);
    else if (/\.(m?js|ts)$/.test(target)) missingImports(target, seen, missing);
  }
  return missing;
}

// ---------- shared helpers ----------

// Modules are loaded inside the checks: a module that fails to load fails a check, not all of them.
async function moduleWith(path, names) {
  let module = null;
  let problem = null;
  try {
    module = await import(path);
  } catch (error) {
    problem = `${error?.name}: ${error?.message}`;
  }
  expect(problem, `an error while loading ${path.slice(2)}`).toBeNull();
  for (const name of names) expect(typeof module[name], `the named export ${name} of ${path.slice(2)}`).toBe('function');
  return module;
}
/** A stand-in for localStorage that keeps the text in a plain object. */
function memoryStorage() {
  const data = {};
  return {
    getItem: (key) => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    saved() {
      try {
        return JSON.parse(data[KEY]);
      } catch (error) {
        return null;
      }
    },
  };
}
const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
const form = () => screen.$('form');
/** The form field whose label contains `label`. */
const field = (label) => [...(form()?.querySelectorAll('input, select, textarea') ?? [])].find((node) => inOrder(screen.nameOf(node), label)) ?? null;
async function setValue(node, value) {
  node.value = value;
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}
const cardIds = () => cards().map((node) => node.dataset.id);
const cards = () => [...(screen.$(LIST)?.querySelectorAll('[data-id]') ?? [])];
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
/** The text of a card without its buttons (a button may repeat the word of a mark). */
function cardText(id) {
  const copy = card(id)?.cloneNode(true);
  if (!copy) return '';
  for (const button of copy.querySelectorAll('button')) button.remove();
  return copy.textContent;
}
/** The button of a card whose accessible name contains `label`. */
const cardButton = (id, label) => [...(card(id)?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label)) ?? null;
/** The saved records, or null. */
function savedRecords() {
  try {
    return JSON.parse(storage.getItem(KEY)).records;
  } catch (error) {
    return null;
  }
}
const savedRecord = (id) => savedRecords()?.find((record) => record.id === id) ?? null;
async function until(condition, timeout = 1500) {
  try {
    await waitFor(() => condition() === true, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}
/** Restarts the page with only `text` saved (nothing when text is null) and waits for six cards. */
async function startPage(text) {
  const page = await moduleWith(PAGE, ['start']);
  storage.clear();
  if (text !== null) storage.setItem(KEY, text);
  let thrown = null;
  try {
    Promise.resolve(page.start(storage)).catch(() => {});
  } catch (error) {
    thrown = error;
  }
  expect(thrown === null ? null : `${thrown.name}: ${thrown.message}`, 'an error thrown by start(storage)').toBeNull();
  // Waits until the load is over (some cards are there), then expects exactly the first page.
  await until(() => cards().length > 0, 2500);
  await settle();
  expect(cards().length, 'the number of cards after a start (the first page of the six starting habits)').toBe(4);
  return page;
}

// ---------- running the learner's suite with swapped modules ----------

const blobUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
function resolvePath(from, spec) {
  const parts = from.split('/').slice(0, -1);
  for (const segment of spec.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return parts.join('/');
}
const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g;
/** Blob URLs for `path` and every project module it imports; `given` replaces project files. */
function moduleUrls(path, given, urls = {}) {
  if (urls[path] !== undefined) return urls;
  const code = given[path] ?? files[path];
  if (typeof code !== 'string') throw new Error(`there is no file ${path}`);
  urls[path] = null;
  for (const match of code.matchAll(IMPORT)) {
    const target = resolvePath(path, match[3]);
    if (/\.(m?js|ts)$/.test(target) && (given[target] !== undefined || typeof files[target] === 'string')) moduleUrls(target, given, urls);
  }
  urls[path] = blobUrl(code.replace(IMPORT, (all, before, quote, spec) => {
    const target = resolvePath(path, spec);
    return before + JSON.stringify(urls[target] ?? `~/${target}`);
  }));
  return urls;
}
async function withoutHarness(use) {
  const saved = HARNESS.map((name) => [name, Object.getOwnPropertyDescriptor(window, name)]);
  for (const name of HARNESS) delete window[name];
  try {
    return await use();
  } finally {
    for (const [name, descriptor] of saved) if (descriptor) Object.defineProperty(window, name, descriptor);
  }
}
/** Runs the learner's suite with `code` as the module SWAP. */
async function runSuite(code) {
  try {
    const urls = moduleUrls(SUITE, { [SWAP]: code, [RUNNER]: TESTING });
    return await withoutHarness(async () => {
      await import(urls[SUITE]);
      const runner = await import(urls[RUNNER]);
      return { results: await runner.run({ print: false }) };
    });
  } catch (error) {
    return { error: `${error?.name}: ${error?.message}` };
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
async function expectPassesOnCorrect() {
  const run = await runSuite(CORRECT);
  expect(run.error ?? null, `an error while ${SUITE} ran with the course's ${SWAP}`).toBeNull();
  expect(run.results.length, `the number of tests in ${SUITE}`).toBeGreaterThan(0);
  expect(failing(run.results), `your tests that fail with the course's ${SWAP}`).toEqual([]);
}
async function expectCatches(code, defect) {
  await expectPassesOnCorrect();
  const run = await runSuite(code);
  const caught = run.error !== undefined || run.results.some((result) => !result.passed);
  expect(caught, `a failing test of yours when ${SWAP} ${defect}`).toBe(true);
}

// ---------- checks: the modules ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the domain and storage modules are TypeScript files', () => {
  for (const path of [DOMAIN, STORAGE]) expect(typeof files[path], `the file ${path}`).toBe('string');
  for (const path of [DOMAIN, STORAGE].map((name) => name.replace(/\.ts$/, '.js'))) expect(typeof files[path], `the old file ${path}`).toBe('undefined');
});

test('every import names a file that exists', () => {
  const missing = [...missingImports('app.js'), ...missingImports('run-tests.js')];
  expect(missing, 'imports that point at no file (Node.js and a browser do not turn ".js" into ".ts")').toEqual([]);
});

test('tsconfig.json asks for strict checking', () => {
  let config = null;
  try {
    config = JSON.parse(files['tsconfig.json']);
  } catch (error) {
    config = null;
  }
  expect(config !== null && typeof config === 'object', 'tsconfig.json is a JSON object').toBe(true);
  expect(config.compilerOptions?.strict, 'compilerOptions.strict in tsconfig.json').toBe(true);
  const tsImports = config.compilerOptions?.allowImportingTsExtensions === true || config.compilerOptions?.rewriteRelativeImportExtensions === true;
  expect(tsImports, 'compilerOptions.allowImportingTsExtensions (or rewriteRelativeImportExtensions) in tsconfig.json, so imports may end with .ts').toBe(true);
});

// ---------- checks: the rules ----------

test('the domain rules behave as before', async () => {
  const { validateHabit, summarizeHabit, sortHabitsByName } = await moduleWith('./' + DOMAIN, ['validateHabit', 'summarizeHabit', 'sortHabitsByName']);
  expect(validateHabit({ name: '  ' + L.newName + ' ' }), 'validateHabit of a valid draft').toEqual({ ok: true, value: { name: L.newName, frequency: 'daily' } });
  expect(validateHabit({ name: '', frequency: 'monthly' }), 'validateHabit of an empty name and the frequency "monthly"').toEqual({ ok: false, errors: { name: 'required', frequency: 'unknown' } });
  expect(summarizeHabit(fixtures()[0], ['2026-02-28', '2026-03-01', '2026-03-02', '2026-03-03']), 'summarizeHabit of h-01 over four days').toEqual({ count: 2, rate: 0.5 });
  expect(sortHabitsByName([{ ...fixtures()[0], name: 'b' }, { ...fixtures()[1], name: 'a' }]).map((habit) => habit.name), 'sortHabitsByName of the names b, a').toEqual(['a', 'b']);
});

test('isUsableHabit checks every field of an unknown value', async () => {
  const { isUsableHabit } = await moduleWith('./' + STORAGE, ['isUsableHabit']);
  expect(isUsableHabit(good()), `isUsableHabit of a complete habit`).toBe(true);
  const cases = [
    ['null', null], ['the number 5', 5], ['the text "h-01"', 'h-01'], ['an array', []], ['{}', {}],
    ['no completions field', without('completions')], ['the frequency "monthly"', { ...good(), frequency: 'monthly' }], ['completions out of order', { ...good(), completions: ['2026-03-01', '2026-02-27'] }],
    ['a repeated completion', { ...good(), completions: ['2026-02-27', '2026-02-27'] }], ['a completion "1.03.2026"', { ...good(), completions: ['1.03.2026'] }], ['completions "2026-03-01"', { ...good(), completions: '2026-03-01' }], ['active "yes"', { ...good(), active: 'yes' }],
  ];
  for (const [what, value] of cases) expect(isUsableHabit(value), `isUsableHabit of ${what}`).toBe(false);
});

test('loadHabits refuses saved records with a repeated id', async () => {
  const { loadHabits } = await moduleWith('./' + STORAGE, ['loadHabits']);
  const text = saved([good(), { ...good() }]);
  const store = { data: { [KEY]: text }, getItem(key) { return this.data[key] ?? null; }, setItem(key, value) { this.data[key] = String(value); } };
  expect(loadHabits(store), `loadHabits of two saved habits with the id h-01`).toEqual({ ok: false, reason: 'duplicate-id' });
  expect(store.data[BACKUP], `the backup copy under ${BACKUP}`).toBe(text);
  expect(store.data[KEY], `the text under ${KEY} after loadHabits`).toBe(text);
  const fine = { data: { [KEY]: saved(fixtures()) }, getItem(key) { return this.data[key] ?? null; }, setItem(key, value) { this.data[key] = String(value); } };
  expect(loadHabits(fine), `loadHabits of the six starting habits`).toEqual({ ok: true, habits: fixtures() });
});

test('indexById works for any records with an id', async () => {
  const { indexById } = await moduleWith('./' + DOMAIN, ['indexById']);
  const records = [{ id: 'a', step: 1 }, { id: 'b', step: 2 }, { id: 'a', step: 3 }];
  const index = indexById(records);
  expect(index instanceof Map, 'indexById(records) is a Map').toBe(true);
  expect([...index.keys()], 'the ids in the index').toEqual(['a', 'b']);
  expect(index.get('a') === records[0], 'the record kept for the id a is the first one').toBe(true);
});

test('sortBy sorts a copy of any records by a key', async () => {
  const { sortBy } = await moduleWith('./' + DOMAIN, ['sortBy']);
  const days = ['2026-03-01', '2026-02-27', '2026-02-28'];
  expect(sortBy(days, (day) => day), 'sortBy of three days by the day itself').toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  expect(days, 'the array passed in').toEqual(['2026-03-01', '2026-02-27', '2026-02-28']);
  const people = [{ id: 'x', name: 'b' }, { id: 'y', name: 'a' }, { id: 'z', name: 'b' }];
  expect(sortBy(people, (one) => one.name).map((one) => one.id), 'sortBy of records by name (equal names keep their order)').toEqual(['y', 'x', 'z']);
});

// ---------- checks: the page ----------

test('saved habits with a repeated id are not shown', async () => {
  await startPage(saved([good(), { ...good() }]));
  expect(cardIds(), 'the cards shown instead (the first page of the starting habits)').toEqual(['h-01', 'h-02', 'h-03', 'h-04']);
  expect(inOrder(screen.text(), L.loadErrorMessage), `"${L.loadErrorMessage}" on the page`).toBe(true);
});

// ---------- checks: the learner's tests ----------

test('your domain tests import the .ts module and pass', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch an indexById that keeps the last of a repeated id', async () => {
  await expectCatches(BROKEN.indexKeepsLast, 'has an indexById that keeps the last record of a repeated id');
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
