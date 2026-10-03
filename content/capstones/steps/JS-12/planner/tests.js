// Checks of capstone step JS-12, planner variant: a due date is a plain "YYYY-MM-DD" text or null
// (isCalendarDate with anchors); search compares search keys (NFC, trimmed, lower case) of the title;
// the page shows dates through Intl.DateTimeFormat with timeZone "UTC" in ui/format.js; indexById and
// prioritiesInUse build a Map and a Set; and the learner's domain tests catch a search key without
// normalize and a date check without anchors.
//
// The checks start with an empty storage; page checks call start(storage) of ui/page.js again (a
// restart). Date display is also checked as if this computer were in a time zone 14 hours ahead of
// UTC and in one 11 hours behind it. The learner's suite tests/domain.test.js is run again with
// swapped modules (a correct or a broken domain/tasks.js and the course runner), with every global
// of this harness hidden.
const KEY = 'jsll.planner.v1';
const DOMAIN = 'domain/tasks.js';
const FORMAT = 'ui/format.js';
const SWAP = DOMAIN;
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#tasks';
const LOCALE = L.formatLocale;
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The rules of a task: pure functions. No page and no storage here; the starting tasks are in\n// data/tasks.json.\n\n// The word for a priority value.\nexport function priorityText(priority) {\n  switch (priority) {\n    case \"low\":\n      return \"%%priorityLow%%\";\n    case \"normal\":\n      return \"%%priorityNormal%%\";\n    case \"high\":\n      return \"%%priorityHigh%%\";\n    default:\n      return \"\";\n  }\n}\n\n// The label of a task: the title, the due date (or a fallback text) in brackets and the priority in words.\nexport function formatTaskLabel(task) {\n  return task.title + \" (\" + (task.dueDate ?? \"%%noDueDate%%\") + \") · \" + priorityText(task.priority);\n}\n\n// A calendar date is text of exactly the form \"YYYY-MM-DD\": the anchors ^ and $ refuse anything\n// before or after it, such as a time.\nexport function isCalendarDate(value) {\n  return typeof value === \"string\" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value);\n}\n\n// Checks a draft task. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateTask(input) {\n  const errors = {};\n\n  const title = (input.title ?? \"\").trim();\n  if (title === \"\") {\n    errors.title = \"required\";\n  } else if (title.length > 80) {\n    errors.title = \"too-long\";\n  }\n\n  // The three known priorities share one break; a missing priority is \"normal\".\n  const priority = input.priority ?? \"normal\";\n  switch (priority) {\n    case \"low\":\n    case \"normal\":\n    case \"high\":\n      break;\n    default:\n      errors.priority = \"unknown\";\n  }\n\n  // A due date is a plain calendar date \"YYYY-MM-DD\" or null: no time and no time zone.\n  const dueDate = input.dueDate ?? null;\n  if (dueDate !== null && !isCalendarDate(dueDate)) {\n    errors.dueDate = \"bad-date\";\n  }\n\n  if (errors.title !== undefined || errors.priority !== undefined || errors.dueDate !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { title: title, dueDate: dueDate, priority: priority } };\n}\n\n// A new list with a new task at the end, if the draft passes the check; otherwise the same list.\n// The draft may also carry the done flag.\nexport function addTask(list, id, input) {\n  const check = validateTask(input);\n  if (!check.ok) {\n    return list;\n  }\n  const task = { id: id, title: check.value.title, dueDate: check.value.dueDate, done: input.done === true, priority: check.value.priority };\n  return [...list, task];\n}\n\n// A new list in which the task with this id is replaced by a copy with the changes;\n// the other tasks are the same objects.\nexport function updateTask(list, id, changes) {\n  const result = [];\n  for (const task of list) {\n    if (task.id === id) {\n      result.push({ ...task, ...changes });\n    } else {\n      result.push(task);\n    }\n  }\n  return result;\n}\n\n// A new list without the task with this id.\nexport function removeTask(list, id) {\n  const result = [];\n  for (const task of list) {\n    if (task.id !== id) {\n      result.push(task);\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text) {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The tasks whose title contains the query; both sides are compared by their search key. An empty\n// query keeps every task.\nexport function searchTasks(list, query) {\n  const wanted = searchKey(query);\n  return list.filter((task) => searchKey(task.title).includes(wanted));\n}\n\n// The pending (\"pending\") or the done (\"done\") tasks.\nexport function filterTasks(list, status) {\n  const done = status === \"done\";\n  return list.filter((task) => task.done === done);\n}\n\n// The place of a priority in the order: high first, then normal, then low.\nfunction priorityRank(priority) {\n  switch (priority) {\n    case \"high\":\n      return 0;\n    case \"normal\":\n      return 1;\n    default:\n      return 2;\n  }\n}\n\n// Comparator: earlier due dates first, tasks without a due date after all dated ones;\n// the same due date is ordered by priority. Equal tasks return 0 and keep their order.\nfunction byDueDateThenPriority(a, b) {\n  if (a.dueDate !== b.dueDate) {\n    if (a.dueDate === null) {\n      return 1;\n    }\n    if (b.dueDate === null) {\n      return -1;\n    }\n    return a.dueDate.localeCompare(b.dueDate);\n  }\n  return priorityRank(a.priority) - priorityRank(b.priority);\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortTasks(list) {\n  return list.toSorted(byDueDateThenPriority);\n}\n\n// How many pending tasks are due on or before the day; a task without a due date is never due.\n// Dates are \"YYYY-MM-DD\" text, so comparing the text compares the dates.\nexport function countDueTasks(list, day) {\n  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;\n}\n// An index of the tasks by id: a Map from id to task, so a task is found without a pass over the\n// list. If two tasks share an id, the first one stays in the index.\nexport function indexById(list) {\n  const index = new Map();\n  for (const task of list) {\n    if (!index.has(task.id)) {\n      index.set(task.id, task);\n    }\n  }\n  return index;\n}\n\n// The priorities in use, each once, in the order they first appear.\nexport function prioritiesInUse(list) {\n  const priorities = new Set();\n  for (const task of list) {\n    priorities.add(task.priority);\n  }\n  return priorities;\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  searchKeyWithoutNormalize: broken('  return text.normalize("NFC").trim().toLowerCase();', '  return text.trim().toLowerCase();'),
  dateWithoutAnchors: broken('/^\\d{4}-\\d{2}-\\d{2}$/.test(value)', '/\\d{4}-\\d{2}-\\d{2}/.test(value)'),
};
/** The long date the page must show for a calendar date. */
const dayText = (day, locale = LOCALE) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(day));
const fixtures = () => [
  { id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.fixture3Name, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.fixture4Name, dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: L.fixture6Name, dueDate: '2026-03-05', done: true, priority: 'low' },
];
// Text typed in two Unicode forms: "й" as one character, and as "и" + a combining breve (U+0306).
const KETTLE = 'Чайник';
const KETTLE_DECOMPOSED = 'Чайник';
const task = (id, title, priority = 'normal') => ({ id, title, dueDate: null, done: false, priority });

// Runs `fn` as if this computer's time zone were `timeZone`: `new Date(y, m, d)`, date-time text
// without a zone, the local getters and setters, and formatters without a `timeZone` all follow it.
// UTC methods are untouched, so code that works only in UTC gives the same result as on a real machine.
function withMachineZone(timeZone, fn) {
  const RealDate = Date;
  const RealFormat = Intl.DateTimeFormat;
  const proto = RealDate.prototype;
  const real = { toLocaleString: proto.toLocaleString, toLocaleDateString: proto.toLocaleDateString, toLocaleTimeString: proto.toLocaleTimeString };
  const parts = new RealFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  const offsetAt = (ms) => {
    const whole = Math.floor(ms / 1000) * 1000;
    const p = Object.fromEntries(parts.formatToParts(new RealDate(whole)).map((part) => [part.type, Number(part.value)]));
    return (RealDate.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole) / 60000;
  };
  const fromWall = (y, mo, d, h, mi, s, ms) => {
    const wall = RealDate.UTC(y, mo, d, h, mi, s, ms);
    if (!Number.isFinite(wall)) return NaN;
    // As the language does: a repeated wall time takes the earlier instant, a skipped one the offset before the change.
    const before = offsetAt(wall - 864e5);
    const fits = [before, offsetAt(wall + 864e5)].map((offset) => wall - offset * 60000).filter((t) => (wall - t) / 60000 === offsetAt(t));
    return fits.length > 0 ? Math.min(...fits) : wall - before * 60000;
  };
  const wall = (date) => {
    const ms = date.getTime();
    return Number.isFinite(ms) ? new RealDate(ms + offsetAt(ms) * 60000) : new RealDate(NaN);
  };
  const LOCAL_TEXT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
  const parseLocal = (text) => {
    const m = LOCAL_TEXT.exec(text);
    return m ? fromWall(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0), Number((m[7] ?? '0').padEnd(3, '0'))) : null;
  };
  const setLocal = (date, index, values) => {
    const w = wall(date);
    const f = [w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), w.getUTCHours(), w.getUTCMinutes(), w.getUTCSeconds(), w.getUTCMilliseconds()];
    values.forEach((value, i) => { f[index + i] = Number(value); });
    return date.setTime(fromWall(...f));
  };
  class ZoneDate extends RealDate {
    constructor(...args) {
      if (args.length >= 2) {
        const [y, mo, d = 1, h = 0, mi = 0, s = 0, ms = 0] = args.map(Number);
        super(fromWall(y, mo, d, h, mi, s, ms));
      } else if (args.length === 1 && typeof args[0] === 'string' && parseLocal(args[0]) !== null) {
        super(parseLocal(args[0]));
      } else {
        super(...args);
      }
    }
    static parse(text) {
      const local = parseLocal(String(text));
      return local === null ? RealDate.parse(text) : local;
    }
    getFullYear() { return wall(this).getUTCFullYear(); }
    getMonth() { return wall(this).getUTCMonth(); }
    getDate() { return wall(this).getUTCDate(); }
    getDay() { return wall(this).getUTCDay(); }
    getHours() { return wall(this).getUTCHours(); }
    getMinutes() { return wall(this).getUTCMinutes(); }
    getSeconds() { return wall(this).getUTCSeconds(); }
    getMilliseconds() { return wall(this).getUTCMilliseconds(); }
    getTimezoneOffset() { return Number.isFinite(this.getTime()) ? -offsetAt(this.getTime()) : NaN; }
    setFullYear(...values) { return setLocal(this, 0, values); }
    setMonth(...values) { return setLocal(this, 1, values); }
    setDate(value) { return setLocal(this, 2, [value]); }
    setHours(...values) { return setLocal(this, 3, values); }
    setMinutes(...values) { return setLocal(this, 4, values); }
    setSeconds(...values) { return setLocal(this, 5, values); }
    setMilliseconds(value) { return setLocal(this, 6, [value]); }
    toString() { return new RealFormat('en-US', { timeZone, dateStyle: 'full', timeStyle: 'long' }).format(this); }
    toDateString() { return new RealFormat('en-US', { timeZone, dateStyle: 'full' }).format(this); }
  }
  const withZone = (options) => ({ ...(options ?? {}), timeZone: options?.timeZone ?? timeZone });
  function ZoneFormat(locales, options) {
    return new RealFormat(locales, withZone(options));
  }
  ZoneFormat.prototype = RealFormat.prototype;
  ZoneFormat.supportedLocalesOf = RealFormat.supportedLocalesOf;
  globalThis.Date = ZoneDate;
  Intl.DateTimeFormat = ZoneFormat;
  for (const name of Object.keys(real)) {
    proto[name] = function (locales, options) { return real[name].call(this, locales, withZone(options)); };
  }
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
    Intl.DateTimeFormat = RealFormat;
    Object.assign(proto, real);
  }
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
  expect(await until(() => cards().length === 6, 2500), 'six cards of the starting tasks after a start with nothing saved').toBe(true);
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
    if (/\.m?js$/.test(target) && (given[target] !== undefined || typeof files[target] === 'string')) moduleUrls(target, given, urls);
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

// ---------- checks: the rules ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('validateTask accepts only a calendar date as the due date', async () => {
  const { validateTask } = await moduleWith('./' + DOMAIN, ['validateTask']);
  for (const dueDate of ['2026-03-02T10:00', '02.03.2026', '2026-3-2', 'x2026-03-02', '']) {
    expect(validateTask({ title: L.fixture1Name, dueDate }), `validateTask with the due date "${dueDate}"`).toEqual({ ok: false, errors: { dueDate: 'bad-date' } });
  }
  expect(validateTask({ title: L.fixture1Name, dueDate: '2026-03-02' }), 'validateTask with the due date "2026-03-02"').toEqual({ ok: true, value: { title: L.fixture1Name, dueDate: '2026-03-02', priority: 'normal' } });
  expect(validateTask({ title: L.fixture1Name, dueDate: null }).ok, 'validateTask with the due date null').toBe(true);
  expect(validateTask({ title: L.fixture1Name }).ok, 'validateTask without a due date').toBe(true);
});

test('isCalendarDate checks the whole text', async () => {
  const { isCalendarDate } = await moduleWith('./' + DOMAIN, ['isCalendarDate']);
  expect(isCalendarDate('2026-03-02'), 'isCalendarDate("2026-03-02")').toBe(true);
  expect(isCalendarDate('2026-03-02T10:00'), 'isCalendarDate("2026-03-02T10:00")').toBe(false);
  expect(isCalendarDate(' 2026-03-02'), 'isCalendarDate(" 2026-03-02")').toBe(false);
  expect(isCalendarDate(null), 'isCalendarDate(null)').toBe(false);
});

test('a saved task with another date format is not shown', async () => {
  const saved = JSON.stringify({ schemaVersion: 1, records: [{ ...fixtures()[0], dueDate: '02.03.2026' }] });
  const page = await moduleWith(PAGE, ['start']);
  storage.clear();
  storage.setItem(KEY, saved);
  page.start(storage);
  expect(await until(() => cards().length === 6, 2500), 'the six starting tasks instead of a saved task due "02.03.2026"').toBe(true);
  expect(inOrder(screen.text(), L.loadErrorMessage), `"${L.loadErrorMessage}" on the page`).toBe(true);
});

test('searchKey normalizes, trims and lowercases', async () => {
  const { searchKey } = await moduleWith('./' + DOMAIN, ['searchKey']);
  expect(searchKey(`  ${KETTLE_DECOMPOSED.toUpperCase()} `), 'searchKey of " ЧАИ\\u0306НИК " (й as и + U+0306)').toBe(KETTLE.toLowerCase());
  expect(searchKey('Café'), 'searchKey of "Cafe\\u0301" (é as e + U+0301)').toBe('café');
  expect(searchKey(KETTLE), `searchKey of "${KETTLE}"`).toBe(KETTLE.toLowerCase());
});

test('searchTasks compares search keys of the title', async () => {
  const { searchTasks } = await moduleWith('./' + DOMAIN, ['searchTasks']);
  const list = [task('a', L.fixture1Name), task('b', `${KETTLE_DECOMPOSED} помити`), task('c', 'Café')];
  const found = (query) => searchTasks(list, query).map((one) => one.id);
  expect(found('чайник'), 'searchTasks for "чайник" when the title is stored as "Чаи\\u0306ник помити"').toEqual(['b']);
  expect(found(' ЧАЙ '), 'searchTasks for " ЧАИ\\u0306 "').toEqual(['b']);
  expect(found('CAFÉ'), 'searchTasks for "CAFE\\u0301"').toEqual(['c']);
  expect(found(''), 'searchTasks for ""').toEqual(['a', 'b', 'c']);
});

test('indexById builds a Map from id to task', async () => {
  const { indexById } = await moduleWith('./' + DOMAIN, ['indexById']);
  const list = fixtures();
  const index = indexById(list);
  expect(index instanceof Map, 'indexById(list) is a Map').toBe(true);
  expect(index.size, 'the size of the index of six tasks').toBe(6);
  expect(index.get('t-03') === list[2], 'index.get("t-03") is the very task t-03 of the list').toBe(true);
  const twice = indexById([task('x', L.fixture1Name), task('x', L.fixture2Name)]);
  expect(twice.get('x')?.title, 'the task kept for an id that two tasks share').toBe(L.fixture1Name);
  expect(indexById([]).size, 'the size of the index of []').toBe(0);
});

test('prioritiesInUse builds a Set of the priorities', async () => {
  const { prioritiesInUse } = await moduleWith('./' + DOMAIN, ['prioritiesInUse']);
  const priorities = prioritiesInUse(fixtures());
  expect(priorities instanceof Set, 'prioritiesInUse(list) is a Set').toBe(true);
  expect([...priorities], 'the priorities of the six starting tasks, in order').toEqual(['normal', 'high', 'low']);
  expect([...prioritiesInUse([task('a', L.fixture1Name, 'low'), task('b', L.fixture2Name, 'low')])], 'the priorities of two low tasks').toEqual(['low']);
});

test('formatDay shows the long date through Intl', async () => {
  const { formatDay } = await moduleWith('./' + FORMAT, ['formatDay']);
  for (const locale of ['uk-UA', 'en-US']) {
    for (const day of ['2026-03-02', '2026-12-31']) expect(formatDay(day, locale), `formatDay("${day}", "${locale}")`).toBe(dayText(day, locale));
  }
});

test('formatDay shows the same day in every time zone', async () => {
  const { formatDay } = await moduleWith('./' + FORMAT, ['formatDay']);
  for (const [zone, where] of [['Pacific/Kiritimati', '14 hours ahead of UTC'], ['Pacific/Pago_Pago', '11 hours behind UTC']]) {
    for (const day of ['2026-03-01', '2026-03-02']) {
      expect(withMachineZone(zone, () => formatDay(day, 'en-US')), `formatDay("${day}", "en-US") on a computer ${where}`).toBe(dayText(day, 'en-US'));
    }
  }
});

// ---------- checks: the page ----------

test('the cards and the summary show dates as long dates', async () => {
  await startPage(null);
  expect(inOrder(cardText('t-01'), `${L.valueLabel}: ${dayText('2026-03-02')}`), `"${L.valueLabel}: ${dayText('2026-03-02')}" in the card of t-01`).toBe(true);
  expect(inOrder(cardText('t-05'), `${L.valueLabel}: ${dayText('2026-03-10')}`), `"${L.valueLabel}: ${dayText('2026-03-10')}" in the card of t-05`).toBe(true);
  expect(inOrder(cardText('t-03'), `${L.valueLabel}: ${L.noDueDate}`), `"${L.valueLabel}: ${L.noDueDate}" in the card of t-03`).toBe(true);
  expect(inOrder(screen.$('#summary')?.textContent, L.dueSummary, dayText('2026-03-02'), '2'), `"${L.dueSummary} ${dayText('2026-03-02')}: 2" in the summary`).toBe(true);
  expect(savedRecord('t-01'), `the saved value of ${KEY} after only showing the tasks`).toBeNull();
});

test('the page lists the priorities in use', async () => {
  await startPage(null);
  const words = [L.priorityNormal, L.priorityHigh, L.priorityLow];
  expect(inOrder(screen.text(), L.prioritiesInUseLabel, ...words), `"${L.prioritiesInUseLabel}: ${words.join(', ')}" on the page`).toBe(true);
  for (const id of ['t-03', 't-06']) {
    await user.click(cardButton(id, L.deleteLabel) ?? document.body);
    await user.click(cardButton(id, L.confirmDeleteLabel) ?? document.body);
  }
  expect(await until(() => cards().length === 4), 'four cards after t-03 and t-06 (the two low tasks) were deleted').toBe(true);
  const line = [...screen.$$('p')].map((node) => node.textContent).find((text) => inOrder(text, L.prioritiesInUseLabel)) ?? '';
  expect(inOrder(line, L.priorityLow), `"${L.priorityLow}" in the line "${line}" after the low tasks were deleted`).toBe(false);
});

// ---------- checks: the learner's tests ----------

test('your domain tests pass with a correct domain module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a search key without normalize', async () => {
  await expectCatches(BROKEN.searchKeyWithoutNormalize, 'has a searchKey that does not call normalize("NFC")');
});

test('your tests catch a date check without anchors', async () => {
  await expectCatches(BROKEN.dateWithoutAnchors, 'has an isCalendarDate whose pattern has no ^ and $, so "2026-03-02T10:00" passes');
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
