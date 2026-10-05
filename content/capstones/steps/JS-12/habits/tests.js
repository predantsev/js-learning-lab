// Checks of capstone step JS-12, habits variant: completions stay unique, sorted "YYYY-MM-DD" texts
// (uniqueSortedDays with a Set, isCalendarDate with anchors); search compares search keys (NFC,
// trimmed, lower case) of the name; the page shows dates through Intl.DateTimeFormat with timeZone
// "UTC" in ui/format.js; indexById builds a Map; and the learner's domain tests catch a search key
// without normalize and completions that are not sorted.
//
// The checks start with an empty storage; page checks call start(storage) of ui/page.js again (a
// restart). Date display is also checked as if this computer were in a time zone 14 hours ahead of
// UTC and in one 11 hours behind it. The learner's suite tests/domain.test.js is run again with
// swapped modules (a correct or a broken domain/tasks.js and the course runner), with every global
// of this harness hidden.
const KEY = 'jsll.habits.v1';
const DOMAIN = 'domain/habits.js';
const FORMAT = 'ui/format.js';
const SWAP = DOMAIN;
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#habits';
const LOCALE = L.formatLocale;
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The rules of a habit: pure functions. No page and no storage here; the starting habits are in\n// data/habits.json.\n\n// The word for a frequency value.\nexport function frequencyText(frequency) {\n  switch (frequency) {\n    case \"daily\":\n      return \"%%daily%%\";\n    case \"weekly\":\n      return \"%%weekly%%\";\n    default:\n      return \"\";\n  }\n}\n\n// The label of a habit: the name, the frequency in words, and a mark when the habit is paused.\nexport function formatHabitLabel(habit) {\n  const label = habit.name + \" · \" + frequencyText(habit.frequency);\n  if (habit.active === false) {\n    return label + \" · %%pausedMark%%\";\n  }\n  return label;\n}\n\n// Checks a draft habit. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateHabit(input) {\n  const errors = {};\n\n  const name = (input.name ?? \"\").trim();\n  if (name === \"\") {\n    errors.name = \"required\";\n  } else if (name.length > 80) {\n    errors.name = \"too-long\";\n  }\n\n  // The two known frequencies share one break; a missing frequency is \"daily\".\n  const frequency = input.frequency ?? \"daily\";\n  switch (frequency) {\n    case \"daily\":\n    case \"weekly\":\n      break;\n    default:\n      errors.frequency = \"unknown\";\n  }\n\n  if (errors.name !== undefined || errors.frequency !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { name: name, frequency: frequency } };\n}\n\n// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.\n// Every new habit gets its own, new completions array; the draft may also carry the active flag.\nexport function addHabit(list, id, input) {\n  const check = validateHabit(input);\n  if (!check.ok) {\n    return list;\n  }\n  const habit = { id: id, name: check.value.name, frequency: check.value.frequency, active: input.active ?? true, completions: [] };\n  return [...list, habit];\n}\n\n// A new list in which the habit with this id is replaced by a copy with the changes;\n// the other habits are the same objects.\nexport function updateHabit(list, id, changes) {\n  const result = [];\n  for (const habit of list) {\n    if (habit.id === id) {\n      result.push({ ...habit, ...changes });\n    } else {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A new list without the habit with this id.\nexport function removeHabit(list, id) {\n  const result = [];\n  for (const habit of list) {\n    if (habit.id !== id) {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A calendar date is text of exactly the form \"YYYY-MM-DD\": the anchors ^ and $ refuse anything\n// before or after it, such as a time.\nexport function isCalendarDate(value) {\n  return typeof value === \"string\" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value);\n}\n\n// The days without repeats, in ascending order. A Set keeps every day once; \"YYYY-MM-DD\" text\n// sorts in the same order as the dates.\nexport function uniqueSortedDays(days) {\n  return [...new Set(days)].toSorted();\n}\n\n// A new list in which the habit with this id has the day in a NEW completions array. The dates\n// stay unique and sorted, so an earlier day lands in its place. A day that is already there, or\n// text that is not a calendar date, changes nothing.\nexport function completeHabit(list, id, day) {\n  if (!isCalendarDate(day)) {\n    return list;\n  }\n  const result = [];\n  for (const habit of list) {\n    if (habit.id !== id || habit.completions.includes(day)) {\n      result.push(habit);\n    } else {\n      result.push({ ...habit, completions: uniqueSortedDays([...habit.completions, day]) });\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text) {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The habits whose name contains the query; both sides are compared by their search key. An empty\n// query keeps every habit.\nexport function searchHabits(list, query) {\n  const wanted = searchKey(query);\n  return list.filter((habit) => searchKey(habit.name).includes(wanted));\n}\n\n// The active (\"active\") or the paused (\"paused\") habits.\nexport function filterHabits(list, status) {\n  const active = status === \"active\";\n  return list.filter((habit) => habit.active === active);\n}\n\n// Comparator: alphabetical order of the names; equal names return 0 and keep their order.\nfunction byName(a, b) {\n  return a.name.localeCompare(b.name);\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortHabitsByName(list) {\n  return list.toSorted(byName);\n}\n\n// On how many of the given days the habit was completed, and which share of the days that is.\n// No days means no share: the rate is 0, not NaN.\nexport function summarizeHabit(habit, days) {\n  const count = days.filter((day) => habit.completions.includes(day)).length;\n  return { count: count, rate: days.length === 0 ? 0 : count / days.length };\n}\n\n// The names of the habits of a list, each with its completion rate over the days in percent.\nexport function formatRates(list, days) {\n  let text = \"\";\n  for (const habit of list) {\n    if (text !== \"\") {\n      text = text + \"; \";\n    }\n    text = text + habit.name + \" — \" + summarizeHabit(habit, days).rate * 100 + \"%\";\n  }\n  return text;\n}\n// An index of the habits by id: a Map from id to habit, so a habit is found without a pass over the\n// list. If two habits share an id, the first one stays in the index.\nexport function indexById(list) {\n  const index = new Map();\n  for (const habit of list) {\n    if (!index.has(habit.id)) {\n      index.set(habit.id, habit);\n    }\n  }\n  return index;\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  searchKeyWithoutNormalize: broken('  return text.normalize("NFC").trim().toLowerCase();', '  return text.trim().toLowerCase();'),
  daysNotSorted: broken('  return [...new Set(days)].toSorted();', '  return [...new Set(days)];'),
};
/** The long date the page must show for a calendar date. */
const dayText = (day, locale = LOCALE) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(day));
const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
// Text typed in two Unicode forms: "й" as one character, and as "и" + a combining breve (U+0306).
const KETTLE = 'Чайник';
const KETTLE_DECOMPOSED = 'Чайник';
const habit = (id, name, completions = []) => ({ id, name, frequency: 'daily', active: true, completions });

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
  expect(await until(() => cards().length === 6, 2500), 'six cards of the starting habits after a start with nothing saved').toBe(true);
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

test('uniqueSortedDays removes repeats and sorts', async () => {
  const { uniqueSortedDays } = await moduleWith('./' + DOMAIN, ['uniqueSortedDays']);
  const days = ['2026-03-01', '2026-02-27', '2026-03-01', '2026-02-28'];
  expect(uniqueSortedDays(days), `uniqueSortedDays(${JSON.stringify(days)})`).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  expect(days, 'the array passed in').toEqual(['2026-03-01', '2026-02-27', '2026-03-01', '2026-02-28']);
  expect(uniqueSortedDays([]), 'uniqueSortedDays([])').toEqual([]);
});

test('completeHabit keeps the completions unique and sorted', async () => {
  const { completeHabit } = await moduleWith('./' + DOMAIN, ['completeHabit']);
  const list = fixtures();
  const earlier = completeHabit(list, 'h-01', '2026-02-25');
  expect(earlier[0].completions, 'completions of h-01 after completeHabit(list, "h-01", "2026-02-25")').toEqual(['2026-02-25', '2026-02-27', '2026-02-28', '2026-03-01']);
  expect(earlier[1] === list[1], 'the habit h-02 is the same object after a change of h-01').toBe(true);
  expect(list[0].completions, 'completions of h-01 in the list passed in').toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  expect(completeHabit(list, 'h-01', '2026-02-28')[0] === list[0], 'h-01 is the same object after a day that is already there').toBe(true);
  for (const day of ['2026-03-02T08:00', '1.03.2026']) {
    expect(completeHabit(list, 'h-06', day)[5].completions, `completions of h-06 after completeHabit with "${day}"`).toEqual([]);
  }
});

test('isCalendarDate checks the whole text', async () => {
  const { isCalendarDate } = await moduleWith('./' + DOMAIN, ['isCalendarDate']);
  expect(isCalendarDate('2026-03-02'), 'isCalendarDate("2026-03-02")').toBe(true);
  expect(isCalendarDate('2026-03-02T10:00'), 'isCalendarDate("2026-03-02T10:00")').toBe(false);
  expect(isCalendarDate(' 2026-03-02'), 'isCalendarDate(" 2026-03-02")').toBe(false);
  expect(isCalendarDate(null), 'isCalendarDate(null)').toBe(false);
});

test('searchKey normalizes, trims and lowercases', async () => {
  const { searchKey } = await moduleWith('./' + DOMAIN, ['searchKey']);
  expect(searchKey(`  ${KETTLE_DECOMPOSED.toUpperCase()} `), 'searchKey of " ЧАИ\\u0306НИК " (й as и + U+0306)').toBe(KETTLE.toLowerCase());
  expect(searchKey('Café'), 'searchKey of "Cafe\\u0301" (é as e + U+0301)').toBe('café');
  expect(searchKey(KETTLE), `searchKey of "${KETTLE}"`).toBe(KETTLE.toLowerCase());
});

test('searchHabits compares search keys of the name', async () => {
  const { searchHabits } = await moduleWith('./' + DOMAIN, ['searchHabits']);
  const list = [habit('a', L.fixture1Name), habit('b', `${KETTLE_DECOMPOSED} помити`), habit('c', 'Café')];
  const found = (query) => searchHabits(list, query).map((one) => one.id);
  expect(found('чайник'), 'searchHabits for "чайник" when the name is stored as "Чаи\\u0306ник помити"').toEqual(['b']);
  expect(found(' ЧАЙ '), 'searchHabits for " ЧАИ\\u0306 "').toEqual(['b']);
  expect(found('CAFÉ'), 'searchHabits for "CAFE\\u0301"').toEqual(['c']);
  expect(found(''), 'searchHabits for ""').toEqual(['a', 'b', 'c']);
});

test('indexById builds a Map from id to habit', async () => {
  const { indexById } = await moduleWith('./' + DOMAIN, ['indexById']);
  const list = fixtures();
  const index = indexById(list);
  expect(index instanceof Map, 'indexById(list) is a Map').toBe(true);
  expect(index.size, 'the size of the index of six habits').toBe(6);
  expect(index.get('h-03') === list[2], 'index.get("h-03") is the very habit h-03 of the list').toBe(true);
  const twice = indexById([habit('x', L.fixture1Name), habit('x', L.fixture2Name)]);
  expect(twice.get('x')?.name, 'the habit kept for an id that two habits share').toBe(L.fixture1Name);
  expect(indexById([]).size, 'the size of the index of []').toBe(0);
});

test('formatDay shows the long date through Intl', async () => {
  const { formatDay } = await moduleWith('./' + FORMAT, ['formatDay']);
  for (const locale of ['uk-UA', 'en-US']) {
    for (const day of ['2026-03-01', '2026-12-31']) expect(formatDay(day, locale), `formatDay("${day}", "${locale}")`).toBe(dayText(day, locale));
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

test('the cards show the last completion as a long date', async () => {
  await startPage(null);
  expect(inOrder(cardText('h-01'), `${L.lastDoneLabel}: ${dayText('2026-03-01')}`), `"${L.lastDoneLabel}: ${dayText('2026-03-01')}" in the card of h-01`).toBe(true);
  expect(inOrder(cardText('h-05'), `${L.lastDoneLabel}: ${dayText('2026-02-20')}`), `"${L.lastDoneLabel}: ${dayText('2026-02-20')}" in the card of h-05`).toBe(true);
  expect(inOrder(cardText('h-06'), L.lastDoneLabel), `"${L.lastDoneLabel}" in the card of h-06, which has no completions`).toBe(false);
  await user.click(cardButton('h-06', L.markTodayLabel) ?? document.body);
  expect(await until(() => inOrder(cardText('h-06'), `${L.lastDoneLabel}: ${dayText('2026-03-02')}`)), `"${L.lastDoneLabel}: ${dayText('2026-03-02')}" in the card of h-06 after "${L.markTodayLabel}"`).toBe(true);
});

// ---------- checks: the learner's tests ----------

test('your domain tests pass with a correct domain module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a search key without normalize', async () => {
  await expectCatches(BROKEN.searchKeyWithoutNormalize, 'has a searchKey that does not call normalize("NFC")');
});

test('your tests catch completions that are not sorted', async () => {
  await expectCatches(BROKEN.daysNotSorted, 'has a uniqueSortedDays that removes repeats but does not sort, so an earlier day ends up last');
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
