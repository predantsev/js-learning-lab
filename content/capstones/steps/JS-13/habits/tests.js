// Checks of capstone step JS-13, habits variant: the generator paginate(items, size) in
// domain/habits.js yields pages lazily; the page shows the habits four at a time with a "Show
// more" button and a search field whose search waits for a pause in typing; and teardown() of
// ui/page.js removes every listener, cancels the pending search and is safe to call twice, while a
// restart never doubles the listeners. The learner's domain tests catch a paginate that drops the
// short last page.
//
// The checks start with an empty storage; page checks call start(storage) of ui/page.js again (a
// restart). Listeners are counted by wrapping addEventListener and removeEventListener of
// EventTarget.prototype: only listeners on page elements, document and window count, and one removed
// through an AbortSignal counts as removed. Timers are replaced by a fake clock (setTimeout,
// clearTimeout, setInterval, clearInterval) whose pending timers the checks run themselves.
const KEY = 'jsll.habits.v1';
const DOMAIN = 'domain/habits.js';
const SWAP = DOMAIN;
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#habits';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The rules of a habit: pure functions. No page and no storage here; the starting habits are in\n// data/habits.json.\n\n// The word for a frequency value.\nexport function frequencyText(frequency) {\n  switch (frequency) {\n    case \"daily\":\n      return \"%%daily%%\";\n    case \"weekly\":\n      return \"%%weekly%%\";\n    default:\n      return \"\";\n  }\n}\n\n// The label of a habit: the name, the frequency in words, and a mark when the habit is paused.\nexport function formatHabitLabel(habit) {\n  const label = habit.name + \" · \" + frequencyText(habit.frequency);\n  if (habit.active === false) {\n    return label + \" · %%pausedMark%%\";\n  }\n  return label;\n}\n\n// Checks a draft habit. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateHabit(input) {\n  const errors = {};\n\n  const name = (input.name ?? \"\").trim();\n  if (name === \"\") {\n    errors.name = \"required\";\n  } else if (name.length > 80) {\n    errors.name = \"too-long\";\n  }\n\n  // The two known frequencies share one break; a missing frequency is \"daily\".\n  const frequency = input.frequency ?? \"daily\";\n  switch (frequency) {\n    case \"daily\":\n    case \"weekly\":\n      break;\n    default:\n      errors.frequency = \"unknown\";\n  }\n\n  if (errors.name !== undefined || errors.frequency !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { name: name, frequency: frequency } };\n}\n\n// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.\n// Every new habit gets its own, new completions array; the draft may also carry the active flag.\nexport function addHabit(list, id, input) {\n  const check = validateHabit(input);\n  if (!check.ok) {\n    return list;\n  }\n  const habit = { id: id, name: check.value.name, frequency: check.value.frequency, active: input.active ?? true, completions: [] };\n  return [...list, habit];\n}\n\n// A new list in which the habit with this id is replaced by a copy with the changes;\n// the other habits are the same objects.\nexport function updateHabit(list, id, changes) {\n  const result = [];\n  for (const habit of list) {\n    if (habit.id === id) {\n      result.push({ ...habit, ...changes });\n    } else {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A new list without the habit with this id.\nexport function removeHabit(list, id) {\n  const result = [];\n  for (const habit of list) {\n    if (habit.id !== id) {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A calendar date is text of exactly the form \"YYYY-MM-DD\": the anchors ^ and $ refuse anything\n// before or after it, such as a time.\nexport function isCalendarDate(value) {\n  return typeof value === \"string\" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value);\n}\n\n// The days without repeats, in ascending order. A Set keeps every day once; \"YYYY-MM-DD\" text\n// sorts in the same order as the dates.\nexport function uniqueSortedDays(days) {\n  return [...new Set(days)].toSorted();\n}\n\n// A new list in which the habit with this id has the day in a NEW completions array. The dates\n// stay unique and sorted, so an earlier day lands in its place. A day that is already there, or\n// text that is not a calendar date, changes nothing.\nexport function completeHabit(list, id, day) {\n  if (!isCalendarDate(day)) {\n    return list;\n  }\n  const result = [];\n  for (const habit of list) {\n    if (habit.id !== id || habit.completions.includes(day)) {\n      result.push(habit);\n    } else {\n      result.push({ ...habit, completions: uniqueSortedDays([...habit.completions, day]) });\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text) {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The habits whose name contains the query; both sides are compared by their search key. An empty\n// query keeps every habit.\nexport function searchHabits(list, query) {\n  const wanted = searchKey(query);\n  return list.filter((habit) => searchKey(habit.name).includes(wanted));\n}\n\n// The active (\"active\") or the paused (\"paused\") habits.\nexport function filterHabits(list, status) {\n  const active = status === \"active\";\n  return list.filter((habit) => habit.active === active);\n}\n\n// Comparator: alphabetical order of the names; equal names return 0 and keep their order.\nfunction byName(a, b) {\n  return a.name.localeCompare(b.name);\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortHabitsByName(list) {\n  return list.toSorted(byName);\n}\n\n// On how many of the given days the habit was completed, and which share of the days that is.\n// No days means no share: the rate is 0, not NaN.\nexport function summarizeHabit(habit, days) {\n  const count = days.filter((day) => habit.completions.includes(day)).length;\n  return { count: count, rate: days.length === 0 ? 0 : count / days.length };\n}\n\n// The names of the habits of a list, each with its completion rate over the days in percent.\nexport function formatRates(list, days) {\n  let text = \"\";\n  for (const habit of list) {\n    if (text !== \"\") {\n      text = text + \"; \";\n    }\n    text = text + habit.name + \" — \" + summarizeHabit(habit, days).rate * 100 + \"%\";\n  }\n  return text;\n}\n// An index of the habits by id: a Map from id to habit, so a habit is found without a pass over the\n// list. If two habits share an id, the first one stays in the index.\nexport function indexById(list) {\n  const index = new Map();\n  for (const habit of list) {\n    if (!index.has(habit.id)) {\n      index.set(habit.id, habit);\n    }\n  }\n  return index;\n}\n\n// The items in pages of `size`, one page at a time: the generator builds a page only when the next\n// one is asked for, so a page that is never shown is never built. An empty list yields no page.\nexport function* paginate(items, size) {\n  for (let start = 0; start < items.length; start += size) {\n    yield items.slice(start, start + size);\n  }\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  lastPageDropped: broken('  for (let start = 0; start < items.length; start += size) {', '  for (let start = 0; start + size <= items.length; start += size) {'),
};
const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
const saved = (records) => JSON.stringify({ schemaVersion: 1, records });

/** Counts the listeners on page elements, document and window that `body` adds and that are still on. */
async function watchListeners(body) {
  const live = new Set();
  const proto = EventTarget.prototype;
  const add = proto.addEventListener;
  const remove = proto.removeEventListener;
  const counted = (target) => target instanceof Node || target === window;
  const find = (target, type, handler) => [...live].find((e) => e.target === target && e.type === type && e.handler === handler);
  proto.addEventListener = function (type, handler, options) {
    add.call(this, type, handler, options);
    if (!counted(this) || handler === null || handler === undefined || find(this, type, handler)) return;
    const signal = options && typeof options === 'object' ? options.signal : undefined;
    if (signal?.aborted) return;
    const entry = { target: this, type, handler };
    live.add(entry);
    if (signal) add.call(signal, 'abort', () => live.delete(entry), { once: true });
  };
  proto.removeEventListener = function (type, handler, options) {
    remove.call(this, type, handler, options);
    const entry = find(this, type, handler);
    if (entry) live.delete(entry);
  };
  try {
    return await body(() => live.size);
  } finally {
    proto.addEventListener = add;
    proto.removeEventListener = remove;
  }
}

/** Runs `body` with a fake clock: timers wait in `clock.pending` until the check runs them. */
async function withFakeClock(body) {
  const real = { setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, setInterval: window.setInterval, clearInterval: window.clearInterval };
  const pending = new Map();
  let next = 0;
  const schedule = (fn, ms, repeat) => {
    const id = `fake-${(next += 1)}`;
    if (typeof fn === 'function') pending.set(id, { fn, ms: Number(ms) || 0, repeat });
    return id;
  };
  window.setTimeout = (fn, ms) => schedule(fn, ms, false);
  window.setInterval = (fn, ms) => schedule(fn, ms, true);
  window.clearTimeout = (id) => { pending.delete(id); };
  window.clearInterval = (id) => { pending.delete(id); };
  const clock = {
    get pending() { return pending.size; },
    delays: () => [...pending.values()].map((timer) => timer.ms),
    runAll() {
      for (const [id, timer] of [...pending]) {
        if (!timer.repeat) pending.delete(id);
        timer.fn();
      }
    },
  };
  try {
    return await body(clock);
  } finally {
    Object.assign(window, real);
  }
}
const moreButton = () => [...document.querySelectorAll('button')].find((button) => inOrder(screen.nameOf(button), L.moreLabel)) ?? null;
const moreShown = () => {
  const button = moreButton();
  return button !== null && !button.hidden && getComputedStyle(button).display !== 'none';
};
const filterField = () => [...document.querySelectorAll('select')].find((node) => inOrder(screen.nameOf(node), L.filterLabel)) ?? null;
const searchField = () => [...document.querySelectorAll('input')].find((node) => inOrder(screen.nameOf(node), L.searchLabel)) ?? null;
/** Puts text into the search field and fires one input event per letter, as typing does. */
function typeSearch(text) {
  const node = searchField();
  for (let length = 1; length <= text.length; length += 1) {
    node.value = text.slice(0, length);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
async function addThroughForm() {
  await setValue(field(L.nameLabel), L.newName);
  await user.submit(form());
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

// ---------- checks: the generator ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('paginate yields pages of at most size', async () => {
  const { paginate } = await moduleWith('./' + DOMAIN, ['paginate']);
  const numbers = (count) => Array.from({ length: count }, (_, index) => index + 1);
  const pages = paginate(numbers(5), 2);
  expect(typeof pages?.next === 'function' && typeof pages?.[Symbol.iterator] === 'function', 'paginate(list, 2) returns an iterator (a generator)').toBe(true);
  expect([...pages], 'the pages of [1, 2, 3, 4, 5] with size 2').toEqual([[1, 2], [3, 4], [5]]);
  expect([...paginate(numbers(4), 2)], 'the pages of [1, 2, 3, 4] with size 2').toEqual([[1, 2], [3, 4]]);
  expect([...paginate(numbers(3), 4)], 'the pages of [1, 2, 3] with size 4').toEqual([[1, 2, 3]]);
  expect([...paginate([], 2)], 'the pages of []').toEqual([]);
});

test('paginate builds a page only when asked', async () => {
  const { paginate } = await moduleWith('./' + DOMAIN, ['paginate']);
  const list = [1, 2, 3];
  const pages = paginate(list, 2);
  expect(pages.next().value, 'the first page').toEqual([1, 2]);
  list.push(4);
  expect([...pages], 'the remaining pages after 4 was added to the list').toEqual([[3, 4]]);
});

// ---------- checks: the page ----------

test('the list shows four cards and a Show more button', async () => {
  await startPage(null);
  expect(cardIds(), 'the data-id of the cards after a start').toEqual(['h-01', 'h-02', 'h-03', 'h-04']);
  expect(moreShown(), `a visible "${L.moreLabel}" button with two more habits to show`).toBe(true);
});

test('Show more adds the next page under the cards', async () => {
  await startPage(null);
  const first = card('h-01');
  await user.click(moreButton() ?? document.body);
  expect(await until(() => cards().length === 6), `six cards after a click on "${L.moreLabel}"`).toBe(true);
  expect(cardIds(), 'the data-id of the cards in order').toEqual(fixtures().map((record) => record.id));
  expect(card('h-01') === first, 'the card h-01 is the same element after the click (the next page is added, not the list redrawn)').toBe(true);
  expect(moreShown(), `a visible "${L.moreLabel}" button once every habit is shown`).toBe(false);
});

test('a change keeps the pages that were shown', async () => {
  await startPage(null);
  await user.click(moreButton() ?? document.body);
  await addThroughForm();
  expect(await until(() => cards().length === 7), 'seven cards after a new habit was saved with two pages shown').toBe(true);
  expect(savedRecords()?.length, `the number of saved habits in ${KEY}`).toBe(7);
});

test('the search waits for a pause in typing', async () => {
  await startPage(null);
  await withFakeClock(async (clock) => {
    typeSearch(L.fixture5Name);
    expect(clock.pending, `pending timers after typing "${L.fixture5Name}" letter by letter`).toBe(1);
    expect(clock.delays(), 'the delay of the pending timer, in ms').toEqual([300]);
    expect(cardIds(), 'the cards before the timer ran').toEqual(['h-01', 'h-02', 'h-03', 'h-04']);
    clock.runAll();
  });
  expect(await until(() => cardIds().join() === 'h-05'), `only the card h-05 after the search for "${L.fixture5Name}" ran`).toBe(true);
  expect(moreShown(), `a visible "${L.moreLabel}" button with one result`).toBe(false);
});

test('the filter narrows the list at once', async () => {
  await startPage(null);
  const select = filterField();
  expect(select !== null, `a select field named "${L.filterLabel}"`).toBe(true);
  await withFakeClock(async (clock) => {
    await user.select(select, 'paused');
    expect(clock.pending, 'pending timers after a choice in the filter').toBe(0);
  });
  expect(await until(() => cardIds().join() === ['h-05'].join()), `the cards ['h-05'] after the filter "paused"`).toBe(true);
  await user.select(select, 'all');
  expect(await until(() => cards().length === 4), 'four cards after the filter "all"').toBe(true);
});

test('teardown removes every listener the page added', async () => {
  const page = await moduleWith(PAGE, ['start', 'teardown']);
  storage.clear();
  storage.setItem(KEY, saved(fixtures()));
  page.teardown();
  const counts = await watchListeners(async (live) => {
    page.start(storage);
    await settle();
    const afterStart = live();
    page.start(storage);
    await settle();
    const afterRestart = live();
    page.teardown();
    return [afterStart, afterRestart, live()];
  });
  expect(counts[0], 'listeners the page added in start(storage)').toBeGreaterThan(0);
  expect(counts[1], 'listeners after a second start(storage) (a restart must not double them)').toBe(counts[0]);
  expect(counts[2], 'listeners left after teardown()').toBe(0);
});

test('after teardown the page does nothing', async () => {
  await startPage(null);
  const page = await moduleWith(PAGE, ['start', 'teardown']);
  page.teardown();
  await user.click(moreButton() ?? document.body);
  expect(cards().length, `the number of cards after a click on "${L.moreLabel}" after teardown()`).toBe(4);
  await withFakeClock(async (clock) => {
    typeSearch(L.fixture5Name);
    expect(clock.pending, 'pending timers after typing in the search field after teardown()').toBe(0);
  });
  expect(cards().length, 'the number of cards after typing in the search field after teardown()').toBe(4);
});

test('teardown cancels a pending search', async () => {
  await startPage(null);
  const page = await moduleWith(PAGE, ['start', 'teardown']);
  await withFakeClock(async (clock) => {
    typeSearch(L.fixture5Name);
    expect(clock.pending, 'pending timers after typing in the search field').toBe(1);
    page.teardown();
    expect(clock.pending, 'pending timers after teardown()').toBe(0);
  });
  expect(cards().length, 'the number of cards after teardown() cancelled the search').toBe(4);
});

test('teardown is safe to call twice and the page starts again', async () => {
  const page = await moduleWith(PAGE, ['start', 'teardown']);
  let thrown = null;
  try {
    page.teardown();
    page.teardown();
  } catch (error) {
    thrown = `${error?.name}: ${error?.message}`;
  }
  expect(thrown, 'an error thrown by a second teardown()').toBeNull();
  await startPage(null);
  page.start(storage);
  expect(await until(() => cards().length === 4), 'four cards after start(storage) twice in a row').toBe(true);
  await addThroughForm();
  expect(await until(() => savedRecords() !== null), `a saved value of ${KEY} after one submit`).toBe(true);
  await settle();
  expect(savedRecords()?.length, `the number of saved habits after one submit (two would mean doubled listeners)`).toBe(7);
});

test('teardown stops a load that is still on its way', async () => {
  const page = await moduleWith(PAGE, ['start', 'teardown']);
  page.teardown();
  storage.clear();
  const mock = mockFetch(() => ({ status: 200, body: { schemaVersion: 1, records: fixtures() }, delay: 300 }));
  try {
    page.start(storage);
    await sleep(50);
    page.teardown();
    await sleep(450);
    await settle();
    expect(cards().length, 'cards once the answer would have arrived, after teardown() during the load').toBe(0);
  } finally {
    mock.restore();
  }
});

// ---------- checks: the learner's tests ----------

test('your domain tests pass with a correct domain module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a paginate that drops the short last page', async () => {
  await expectCatches(BROKEN.lastPageDropped, 'has a paginate that stops before a last page shorter than size');
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
