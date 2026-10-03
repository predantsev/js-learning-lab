// Checks of capstone step JS-14, planner variant: domain/tasks.ts and storage/tasks.ts replace the
// .js modules and every import names a file that exists (as Node.js resolves it); tsconfig.json asks
// for strict checking; the rules behave as before; isUsableTask checks an unknown value field by
// field, loadTasks refuses a repeated id, and indexById is generic. The learner's domain tests import
// the .ts module and catch an indexById that keeps the last of a repeated id.
//
// Types are not checked here: the platform removes them before running, as Node.js does, and only
// tsc in the exported project checks them. The checks observe behaviour. The learner's suite runs
// again with swapped modules (the course's domain module with its types removed, the course runner),
// with every global of this harness hidden.
const KEY = 'jsll.planner.v1';
const BACKUP = 'jsll.planner.v1.backup';
const DOMAIN = 'domain/tasks.ts';
const STORAGE = 'storage/tasks.ts';
const SWAP = DOMAIN;
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#tasks';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
// The course's domain module with its types removed (a browser cannot run TypeScript from a blob).
const CORRECT = fill("// The rules of a task: pure functions with types. No page and no storage here; the starting tasks\n// are in data/tasks.json. The types exist only for tsc: the platform and Node.js remove them before\n// running, so a value that comes from outside (storage, a file) is still checked at runtime.\n\n// ---------- types ----------\n\n                                                 \n\n                    \n                      \n                \n                                                                                                \n                \n                     \n  \n\n// A draft from the form: every field may be missing, and a priority is any text until it is checked.\n                         \n                 \n                          \n                    \n                 \n  \n\n                                                                            \n\n                          \n                       \n                          \n                         \n  \n\n// The result of validateTask: exactly one of the two shapes; `ok` tells them apart.\n                              \n                                                                                      \n                                      \n\n                                            \n\n// ---------- rules ----------\n\n// The word for a priority value.\nexport function priorityText(priority          )         {\n  switch (priority) {\n    case \"low\":\n      return \"%%priorityLow%%\";\n    case \"normal\":\n      return \"%%priorityNormal%%\";\n    case \"high\":\n      return \"%%priorityHigh%%\";\n    default:\n      return \"\";\n  }\n}\n\n// The label of a task: the title, the due date (or a fallback text) in brackets and the priority in words.\nexport function formatTaskLabel(task      )         {\n  return task.title + \" (\" + (task.dueDate ?? \"%%noDueDate%%\") + \") · \" + priorityText(task.priority);\n}\n\n// A calendar date is text of exactly the form \"YYYY-MM-DD\": the anchors ^ and $ refuse anything\n// before or after it, such as a time.\nexport function isCalendarDate(value         )                  {\n  return typeof value === \"string\" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value);\n}\n\n// A type predicate: true only for the three known priorities, and then tsc treats the text as a\n// Priority.\nexport function isPriority(value         )                    {\n  return value === \"low\" || value === \"normal\" || value === \"high\";\n}\n\n// Checks a draft task. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateTask(input           )                   {\n  const errors             = {};\n\n  const title = (input.title ?? \"\").trim();\n  if (title === \"\") {\n    errors.title = \"required\";\n  } else if (title.length > 80) {\n    errors.title = \"too-long\";\n  }\n\n  // A missing priority is \"normal\"; any other text than the three priorities is unknown.\n  const priority = input.priority ?? \"normal\";\n  if (!isPriority(priority)) {\n    errors.priority = \"unknown\";\n  }\n\n  // A due date is a plain calendar date \"YYYY-MM-DD\" or null: no time and no time zone.\n  const dueDate = input.dueDate ?? null;\n  if (dueDate !== null && !isCalendarDate(dueDate)) {\n    errors.dueDate = \"bad-date\";\n  }\n\n  // !isPriority(priority) is checked here again so that tsc knows the priority below is a Priority.\n  if (errors.title !== undefined || errors.dueDate !== undefined || !isPriority(priority)) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { title: title, dueDate: dueDate, priority: priority } };\n}\n\n// A new list with a new task at the end, if the draft passes the check; otherwise the same list.\n// The draft may also carry the done flag.\nexport function addTask(list        , id        , input           )         {\n  const check = validateTask(input);\n  if (!check.ok) {\n    return list;\n  }\n  const task       = { id: id, title: check.value.title, dueDate: check.value.dueDate, done: input.done === true, priority: check.value.priority };\n  return [...list, task];\n}\n\n// A new list in which the task with this id is replaced by a copy with the changes;\n// the other tasks are the same objects. The id itself cannot be changed.\nexport function updateTask(list        , id        , changes                           )         {\n  const result         = [];\n  for (const task of list) {\n    if (task.id === id) {\n      result.push({ ...task, ...changes });\n    } else {\n      result.push(task);\n    }\n  }\n  return result;\n}\n\n// A new list without the task with this id.\nexport function removeTask(list        , id        )         {\n  const result         = [];\n  for (const task of list) {\n    if (task.id !== id) {\n      result.push(task);\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text        )         {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The tasks whose title contains the query; both sides are compared by their search key. An empty\n// query keeps every task.\nexport function searchTasks(list        , query        )         {\n  const wanted = searchKey(query);\n  return list.filter((task) => searchKey(task.title).includes(wanted));\n}\n\n// The pending (\"pending\") or the done (\"done\") tasks.\nexport function filterTasks(list        , status            )         {\n  const done = status === \"done\";\n  return list.filter((task) => task.done === done);\n}\n\n// The place of a priority in the order: high first, then normal, then low.\nfunction priorityRank(priority          )         {\n  switch (priority) {\n    case \"high\":\n      return 0;\n    case \"normal\":\n      return 1;\n    default:\n      return 2;\n  }\n}\n\n// Comparator: earlier due dates first, tasks without a due date after all dated ones;\n// the same due date is ordered by priority. Equal tasks return 0 and keep their order.\nfunction byDueDateThenPriority(a      , b      )         {\n  if (a.dueDate !== b.dueDate) {\n    if (a.dueDate === null) {\n      return 1;\n    }\n    if (b.dueDate === null) {\n      return -1;\n    }\n    return a.dueDate.localeCompare(b.dueDate);\n  }\n  return priorityRank(a.priority) - priorityRank(b.priority);\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortTasks(list        )         {\n  return list.toSorted(byDueDateThenPriority);\n}\n\n// How many pending tasks are due on or before the day; a task without a due date is never due.\n// Dates are \"YYYY-MM-DD\" text, so comparing the text compares the dates. Inside the filter tsc\n// narrows dueDate: after `task.dueDate !== null` it is a string, so localeCompare is allowed.\nexport function countDueTasks(list        , day        )         {\n  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;\n}\n\n// An index by id: a Map from id to record, so a record is found without a pass over the list. It\n// is generic: it works for any records with a text id, and the Map keeps their type. If two\n// records share an id, the first one stays in the index.\nexport function indexById                                   (list              )                 {\n  const index = new Map           ();\n  for (const item of list) {\n    if (!index.has(item.id)) {\n      index.set(item.id, item);\n    }\n  }\n  return index;\n}\n\n// The priorities in use, each once, in the order they first appear.\nexport function prioritiesInUse(list        )                {\n  const priorities = new Set          ();\n  for (const task of list) {\n    priorities.add(task.priority);\n  }\n  return priorities;\n}\n\n// The items in pages of `size`, one page at a time: the generator builds a page only when the next\n// one is asked for, so a page that is never shown is never built. An empty list yields no page.\nexport function* paginate   (items              , size        )                 {\n  for (let start = 0; start < items.length; start += size) {\n    yield items.slice(start, start + size);\n  }\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  indexKeepsLast: broken('    if (!index.has(item.id)) {\n      index.set(item.id, item);\n    }', '    index.set(item.id, item);'),
};
const fixtures = () => [
  { id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.fixture3Name, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.fixture4Name, dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: L.fixture6Name, dueDate: '2026-03-05', done: true, priority: 'low' },
];
const good = () => ({ id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' });
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
  expect(cards().length, 'the number of cards after a start (the first page of the six starting tasks)').toBe(4);
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
  const { validateTask, countDueTasks, sortTasks } = await moduleWith('./' + DOMAIN, ['validateTask', 'countDueTasks', 'sortTasks']);
  expect(validateTask({ title: '  ' + L.newName + ' ', dueDate: null }), 'validateTask of a valid draft').toEqual({ ok: true, value: { title: L.newName, dueDate: null, priority: 'normal' } });
  expect(validateTask({ title: '', priority: 'urgent' }), 'validateTask of an empty title and the priority "urgent"').toEqual({ ok: false, errors: { title: 'required', priority: 'unknown' } });
  expect(countDueTasks(fixtures(), '2026-03-02'), 'countDueTasks of the six starting tasks on 2026-03-02').toBe(2);
  expect(sortTasks(fixtures()).map((task) => task.id), 'sortTasks of the six starting tasks').toEqual(['t-04', 't-02', 't-01', 't-06', 't-05', 't-03']);
});

test('isUsableTask checks every field of an unknown value', async () => {
  const { isUsableTask } = await moduleWith('./' + STORAGE, ['isUsableTask']);
  expect(isUsableTask(good()), `isUsableTask of a complete task`).toBe(true);
  const cases = [
    ['null', null], ['the number 5', 5], ['the text "t-01"', 't-01'], ['an array', []], ['{}', {}],
    ['no dueDate field', without('dueDate')], ['the priority "urgent"', { ...good(), priority: 'urgent' }], ['the due date "02.03.2026"', { ...good(), dueDate: '02.03.2026' }],
    ['the id 1', { ...good(), id: 1 }], ['no title', without('title')], ['done "no"', { ...good(), done: 'no' }], ['the due date 20260302', { ...good(), dueDate: 20260302 }],
  ];
  for (const [what, value] of cases) expect(isUsableTask(value), `isUsableTask of ${what}`).toBe(false);
});

test('loadTasks refuses saved records with a repeated id', async () => {
  const { loadTasks } = await moduleWith('./' + STORAGE, ['loadTasks']);
  const text = saved([good(), { ...good() }]);
  const store = { data: { [KEY]: text }, getItem(key) { return this.data[key] ?? null; }, setItem(key, value) { this.data[key] = String(value); } };
  expect(loadTasks(store), `loadTasks of two saved tasks with the id t-01`).toEqual({ ok: false, reason: 'duplicate-id' });
  expect(store.data[BACKUP], `the backup copy under ${BACKUP}`).toBe(text);
  expect(store.data[KEY], `the text under ${KEY} after loadTasks`).toBe(text);
  const fine = { data: { [KEY]: saved(fixtures()) }, getItem(key) { return this.data[key] ?? null; }, setItem(key, value) { this.data[key] = String(value); } };
  expect(loadTasks(fine), `loadTasks of the six starting tasks`).toEqual({ ok: true, tasks: fixtures() });
});

test('indexById works for any records with an id', async () => {
  const { indexById } = await moduleWith('./' + DOMAIN, ['indexById']);
  const records = [{ id: 'a', step: 1 }, { id: 'b', step: 2 }, { id: 'a', step: 3 }];
  const index = indexById(records);
  expect(index instanceof Map, 'indexById(records) is a Map').toBe(true);
  expect([...index.keys()], 'the ids in the index').toEqual(['a', 'b']);
  expect(index.get('a') === records[0], 'the record kept for the id a is the first one').toBe(true);
});

// ---------- checks: the page ----------

test('saved tasks with a repeated id are not shown', async () => {
  await startPage(saved([good(), { ...good() }]));
  expect(cardIds(), 'the cards shown instead (the first page of the starting tasks)').toEqual(['t-01', 't-02', 't-03', 't-04']);
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
