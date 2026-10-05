// Checks of capstone step JS-11, habits variant: storage/repository.js exports the class
// HabitRepository and the factory createHabitRepository, which behave the same (the same checks
// run on both); the page changes the list only through the repository and gets a "mark today"
// button on every card; and the learner's tests in tests/repository.test.js run one suite for both designs.
//
// The checks start with an empty storage. Page checks call start(storage) of ui/page.js again,
// which is a restart of the page. The learner's suite is run again with swapped modules: every
// relative import of the project is loaded from a copy, where storage/repository.js is the correct
// or a broken version and tests/testing.js is the course runner (so a changed runner cannot hide a
// failure). While the suite runs, every global of this check harness is hidden.
const KEY = 'jsll.habits.v1';
const REPO = 'storage/repository.js';
const SUITE = 'tests/repository.test.js';
const RUNNER = 'tests/testing.js';
const DRIVER = 'run-tests.js';
const PAGE = './ui/page.js';
const LIST = '#habits';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The habit repository: the current list of habits and its saving, in one place. The same\n// repository is written twice, as a class and as a factory function; both have the same methods\n// and pass the same tests (tests/repository.test.js). The page uses the class.\nimport { addHabit, updateHabit, removeHabit, completeHabit, summarizeHabit } from \"../domain/habits.js\";\nimport { saveHabits } from \"./habits.js\";\n\n// The class keeps the list and the storage in private fields: code outside the class cannot read\n// or replace them, so every change goes through a method, and every method saves.\nexport class HabitRepository {\n  #storage;\n  #habits;\n\n  constructor(storage, habits) {\n    this.#storage = storage;\n    this.#habits = [...habits];\n  }\n\n  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.\n  get items() {\n    return [...this.#habits];\n  }\n\n  // Adds a habit if the draft passes validateHabit; an invalid draft changes nothing.\n  add(id, input) {\n    const next = addHabit(this.#habits, id, input);\n    if (next !== this.#habits) {\n      this.#habits = next;\n      saveHabits(this.#storage, this.#habits);\n    }\n  }\n\n  update(id, changes) {\n    this.#habits = updateHabit(this.#habits, id, changes);\n    saveHabits(this.#storage, this.#habits);\n  }\n\n  remove(id) {\n    this.#habits = removeHabit(this.#habits, id);\n    saveHabits(this.#storage, this.#habits);\n  }\n\n  // Adds the day (\"YYYY-MM-DD\", not earlier than the stored dates) to the habit's completions;\n  // a day that is already there is not added again.\n  markCompleted(id, day) {\n    this.#habits = completeHabit(this.#habits, id, day);\n    saveHabits(this.#storage, this.#habits);\n  }\n\n  // The share of the given days on which the habit was completed; 0 for an unknown habit.\n  completionRate(id, days) {\n    const habit = this.#habits.find((one) => one.id === id);\n    if (habit === undefined) {\n      return 0;\n    }\n    return summarizeHabit(habit, days).rate;\n  }\n}\n\n// The same repository as a factory: the closure keeps the list and the storage, and the methods\n// use them directly, without `this`. So a method still works when it is passed on alone.\nexport function createHabitRepository(storage, initialHabits) {\n  let habits = [...initialHabits];\n\n  function replace(next) {\n    habits = next;\n    saveHabits(storage, habits);\n  }\n\n  return {\n    get items() {\n      return [...habits];\n    },\n    add(id, input) {\n      const next = addHabit(habits, id, input);\n      if (next !== habits) {\n        replace(next);\n      }\n    },\n    update(id, changes) {\n      replace(updateHabit(habits, id, changes));\n    },\n    remove(id) {\n      replace(removeHabit(habits, id));\n    },\n    markCompleted(id, day) {\n      replace(completeHabit(habits, id, day));\n    },\n    completionRate(id, days) {\n      const habit = habits.find((one) => one.id === id);\n      return habit === undefined ? 0 : summarizeHabit(habit, days).rate;\n    },\n  };\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
/** The correct repository module with one piece of code replaced. */
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${REPO} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  classMarkTwice: broken('    this.#habits = completeHabit(this.#habits, id, day);', '    this.#habits = this.#habits.map((habit) => (habit.id === id ? { ...habit, completions: [...habit.completions, day] } : habit));'),
  classMarkNotSaved: broken('    this.#habits = completeHabit(this.#habits, id, day);\n    saveHabits(this.#storage, this.#habits);', '    this.#habits = completeHabit(this.#habits, id, day);'),
  factoryRateAllDates: broken('      return habit === undefined ? 0 : summarizeHabit(habit, days).rate;', '      return habit === undefined || days.length === 0 ? 0 : habit.completions.length / days.length;'),
  classAddSkipsCheck: broken('    const next = addHabit(this.#habits, id, input);', '    const next = [...this.#habits, { id: id, ...input }];'),
};

const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
const LAST_DAYS = ['2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01'];

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
/** Both designs: [name, create(storage, items)]. */
async function designs() {
  const module = await moduleWith('./' + REPO, ['HabitRepository', 'createHabitRepository']);
  return [
    ['new HabitRepository(storage, items)', (store, items) => new module.HabitRepository(store, items)],
    ['createHabitRepository(storage, items)', (store, items) => module.createHabitRepository(store, items)],
  ];
}
const ids = (repository) => repository.items.map((item) => item.id);

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
/** Runs the learner's repository suite with `repo` as storage/repository.js. */
async function runSuite(repo) {
  try {
    const urls = moduleUrls(SUITE, { [REPO]: repo, [RUNNER]: TESTING });
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
  expect(run.error ?? null, `an error while ${SUITE} ran with the course's ${REPO}`).toBeNull();
  expect(run.results.length, `the number of tests in ${SUITE}`).toBeGreaterThan(0);
  expect(failing(run.results), `your tests that fail with the course's ${REPO}`).toEqual([]);
}
async function expectCatches(repo, defect) {
  await expectPassesOnCorrect();
  const run = await runSuite(repo);
  const caught = run.error !== undefined || run.results.some((result) => !result.passed);
  expect(caught, `a failing test of yours when ${REPO} ${defect}`).toBe(true);
}

// ---------- checks: the repository ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('storage/repository.js exports the class and the factory', async () => {
  for (const [design, create] of await designs()) {
    let repository = null;
    let problem = null;
    try {
      repository = create(memoryStorage(), fixtures());
    } catch (error) {
      problem = `${error?.name}: ${error?.message}`;
    }
    expect(problem, `an error thrown by ${design}`).toBeNull();
    expect(Array.isArray(repository?.items) ? ids(repository) : repository?.items, `items of ${design} with the six starting habits`).toEqual(fixtures().map((habit) => habit.id));
  }
});

test('both designs keep the list out of reach', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    const own = Object.getOwnPropertyNames(repository).filter((name) => Array.isArray(Object.getOwnPropertyDescriptor(repository, name).value));
    expect(own, `own properties of ${design} that hold an array`).toEqual([]);
    repository.items.push({ id: 'h-99' });
    expect(ids(repository).length, `the number of habits in ${design} after a push into the array that items returned`).toBe(6);
    try {
      repository.items = [];
    } catch (error) {
      // a getter without a setter refuses the assignment
    }
    expect(ids(repository).length, `the number of habits in ${design} after items = []`).toBe(6);
  }
});

test('both designs add a valid habit and refuse an invalid one', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.add('h-7', { name: L.newName, frequency: 'weekly' });
    expect(repository.items.at(-1), `the last habit of ${design} after add("h-7", { name: "${L.newName}", frequency: "weekly" })`).toEqual({ id: 'h-7', name: L.newName, frequency: 'weekly', active: true, completions: [] });
    repository.add('h-8', { name: '   ', frequency: 'daily' });
    repository.add('h-9', { name: L.newName, frequency: 'monthly' });
    expect(ids(repository).length, `the number of habits in ${design} after two invalid drafts`).toBe(7);
  }
});

test('both designs mark a day once', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.markCompleted('h-06', '2026-03-02');
    repository.markCompleted('h-06', '2026-03-02');
    expect(repository.items[5].completions, `completions of h-06 in ${design} after markCompleted("h-06", "2026-03-02") twice`).toEqual(['2026-03-02']);
    repository.markCompleted('h-01', '2026-03-02');
    expect(repository.items[0].completions, `completions of h-01 in ${design} after markCompleted("h-01", "2026-03-02")`).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
    expect(repository.items.slice(1, 5), `the habits h-02…h-05 of ${design}`).toEqual(fixtures().slice(1, 5));
  }
});

test('both designs save every change', async () => {
  for (const [design, create] of await designs()) {
    const store = memoryStorage();
    const repository = create(store, fixtures());
    const steps = [
      ['add("h-7", …)', () => repository.add('h-7', { name: L.newName, frequency: 'daily' })],
      ['markCompleted("h-01", "2026-03-02")', () => repository.markCompleted('h-01', '2026-03-02')],
      ['update("h-02", { active: false })', () => repository.update('h-02', { active: false })],
      ['remove("h-03")', () => repository.remove('h-03')],
    ];
    for (const [call, run] of steps) {
      run();
      expect(store.saved(), `the saved value of ${KEY} after ${call} of ${design}`).toEqual({ schemaVersion: 1, records: repository.items });
    }
    expect(ids(repository), `the habits of ${design} after the four calls`).toEqual(['h-01', 'h-02', 'h-04', 'h-05', 'h-06', 'h-7']);
  }
});

test('both designs compute the completion rate over the given days', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    const days = JSON.stringify(LAST_DAYS);
    expect(repository.completionRate('h-01', LAST_DAYS), `completionRate("h-01", ${days}) of ${design}`).toBe(0.75);
    // h-04 was also completed on 2026-02-22, which is not one of the days.
    expect(repository.completionRate('h-04', LAST_DAYS), `completionRate("h-04", ${days}) of ${design}`).toBe(0.25);
    expect(repository.completionRate('h-06', LAST_DAYS), `completionRate("h-06", ${days}) of ${design}`).toBe(0);
    expect(repository.completionRate('h-01', []), `completionRate("h-01", []) of ${design}`).toBe(0);
    expect(repository.completionRate('h-99', LAST_DAYS), `completionRate of an unknown id in ${design}`).toBe(0);
  }
});

// ---------- checks: the page ----------

test('every card has a button that marks today once', async () => {
  await startPage(null);
  expect(cardButton('h-01', L.markTodayLabel) !== null, `a button "${L.markTodayLabel}" in the card of h-01`).toBe(true);
  expect(inOrder(cardText('h-01'), L.doneTodayMark), `"${L.doneTodayMark}" in the card of h-01 before a click`).toBe(false);
  await user.click(cardButton('h-01', L.markTodayLabel));
  expect(await until(() => inOrder(cardText('h-01'), L.doneTodayMark)), `"${L.doneTodayMark}" in the card of h-01 after a click on "${L.markTodayLabel}"`).toBe(true);
  expect(inOrder(cardText('h-01'), `${L.completionsLabel}: 4`), `"${L.completionsLabel}: 4" in the card of h-01 after that click`).toBe(true);
  await user.click(cardButton('h-01', L.markTodayLabel) ?? document.body);
  await settle();
  expect(inOrder(cardText('h-01'), `${L.completionsLabel}: 4`), `"${L.completionsLabel}: 4" in the card of h-01 after a second click on the same day`).toBe(true);
  expect(savedRecord('h-01')?.completions, `completions of h-01 in the saved value of ${KEY}`).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
});

test('a mark is saved and survives a restart', async () => {
  const page = await startPage(null);
  await user.click(cardButton('h-06', L.markTodayLabel) ?? document.body);
  expect(await until(() => savedRecord('h-06')?.completions?.includes('2026-03-02') === true), `"2026-03-02" in the completions of h-06 in the saved value of ${KEY} after a click on "${L.markTodayLabel}"`).toBe(true);
  page.start(storage);
  expect(await until(() => inOrder(cardText('h-06'), L.doneTodayMark)), `"${L.doneTodayMark}" in the card of h-06 after a restart`).toBe(true);
});

test('the form and the delete button still change and save the list', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), L.newName);
  await user.submit(form());
  expect(await until(() => cards().length === 7), 'seven cards after a new habit was saved through the form').toBe(true);
  expect(savedRecords()?.at(-1)?.name, `the name of the last saved habit in ${KEY}`).toBe(L.newName);
  await user.click(cardButton('h-03', L.deleteLabel) ?? document.body);
  await user.click(cardButton('h-03', L.confirmDeleteLabel) ?? document.body);
  expect(await until(() => card('h-03') === null), `no card h-03 after "${L.deleteLabel}" and "${L.confirmDeleteLabel}"`).toBe(true);
  expect(savedRecords()?.map((record) => record.id), `the saved ids in ${KEY} after the delete`).toEqual(['h-01', 'h-02', 'h-04', 'h-05', 'h-06', 'h-7']);
});

// ---------- checks: the learner's tests ----------

test('your repository tests pass with a correct repository', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a class that adds an invalid draft', async () => {
  await expectCatches(BROKEN.classAddSkipsCheck, 'has a class whose add skips validateHabit');
});

test('your tests catch a class that marks the same day twice', async () => {
  await expectCatches(BROKEN.classMarkTwice, 'has a class whose markCompleted adds a day that is already there');
});

test('your tests catch a class whose mark is not saved', async () => {
  await expectCatches(BROKEN.classMarkNotSaved, 'has a class whose markCompleted does not save');
});

test('your tests catch a factory whose rate counts days outside the range', async () => {
  await expectCatches(BROKEN.factoryRateAllDates, 'has a factory whose completionRate counts every completion, also outside the days');
});

test('run-tests.js runs the repository tests too', async () => {
  await expectPassesOnCorrect();
  let caughtBy = null;
  for (const repo of Object.values(BROKEN)) {
    const run = await runSuite(repo);
    if (run.results !== undefined && run.results.some((result) => !result.passed)) {
      caughtBy = repo;
      break;
    }
  }
  expect(caughtBy !== null, `a broken ${REPO} that makes one of your tests fail`).toBe(true);
  const exitCodes = [];
  for (const repo of [CORRECT, caughtBy]) {
    let urls = null;
    try {
      urls = moduleUrls(DRIVER, { [REPO]: repo, [RUNNER]: TESTING });
    } catch (error) {
      urls = null;
    }
    expect(urls !== null, `the file ${DRIVER}`).toBe(true);
    const fakeProcess = { exitCode: undefined, env: {}, argv: [] };
    const result = await withoutHarness(async () => {
      Object.defineProperty(window, 'process', { value: fakeProcess, configurable: true, writable: true });
      try {
        await import(urls[DRIVER]);
        return null;
      } catch (error) {
        return `${error?.name}: ${error?.message}`;
      } finally {
        delete window.process;
      }
    });
    expect(result, `an error while ${DRIVER} ran with a \`process\` like the one of Node.js`).toBeNull();
    exitCodes.push(fakeProcess.exitCode ?? 0);
  }
  expect(exitCodes[0], `process.exitCode after ${DRIVER} with a correct ${REPO}`).not.toBe(1);
  expect(exitCodes[1], `process.exitCode after ${DRIVER} with a broken ${REPO}`).toBe(1);
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
