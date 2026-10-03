// Checks of capstone step JS-11, planner variant: storage/repository.js exports the class
// PlannerRepository and the factory createPlannerRepository, which behave the same (the same checks
// run on both); the page changes the list only through the repository and gets a toggle button on
// every card; and the learner's tests in tests/repository.test.js run one suite for both designs.
//
// The checks start with an empty storage. Page checks call start(storage) of ui/page.js again,
// which is a restart of the page. The learner's suite is run again with swapped modules: every
// relative import of the project is loaded from a copy, where storage/repository.js is the correct
// or a broken version and tests/testing.js is the course runner (so a changed runner cannot hide a
// failure). While the suite runs, every global of this check harness is hidden.
const KEY = 'jsll.planner.v1';
const REPO = 'storage/repository.js';
const SUITE = 'tests/repository.test.js';
const RUNNER = 'tests/testing.js';
const DRIVER = 'run-tests.js';
const PAGE = './ui/page.js';
const LIST = '#tasks';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The planner repository: the current list of tasks and its saving, in one place. The same\n// repository is written twice, as a class and as a factory function; both have the same methods\n// and pass the same tests (tests/repository.test.js). The page uses the class.\nimport { addTask, updateTask, removeTask, countDueTasks } from \"../domain/tasks.js\";\nimport { saveTasks } from \"./tasks.js\";\n\n// The class keeps the list and the storage in private fields: code outside the class cannot read\n// or replace them, so every change goes through a method, and every method saves.\nexport class PlannerRepository {\n  #storage;\n  #tasks;\n\n  constructor(storage, tasks) {\n    this.#storage = storage;\n    this.#tasks = [...tasks];\n  }\n\n  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.\n  get items() {\n    return [...this.#tasks];\n  }\n\n  // Adds a task if the draft passes validateTask; an invalid draft changes nothing.\n  add(id, input) {\n    const next = addTask(this.#tasks, id, input);\n    if (next !== this.#tasks) {\n      this.#tasks = next;\n      saveTasks(this.#storage, this.#tasks);\n    }\n  }\n\n  update(id, changes) {\n    this.#tasks = updateTask(this.#tasks, id, changes);\n    saveTasks(this.#storage, this.#tasks);\n  }\n\n  remove(id) {\n    this.#tasks = removeTask(this.#tasks, id);\n    saveTasks(this.#storage, this.#tasks);\n  }\n\n  // A done task becomes pending, a pending task becomes done.\n  toggleDone(id) {\n    const task = this.#tasks.find((one) => one.id === id);\n    if (task === undefined) {\n      return;\n    }\n    this.update(id, { done: !task.done });\n  }\n\n  // How many pending tasks are due on or before the day (\"YYYY-MM-DD\").\n  countDueBy(day) {\n    return countDueTasks(this.#tasks, day);\n  }\n}\n\n// The same repository as a factory: the closure keeps the list and the storage, and the methods\n// use them directly, without `this`. So a method still works when it is passed on alone.\nexport function createPlannerRepository(storage, initialTasks) {\n  let tasks = [...initialTasks];\n\n  function replace(next) {\n    tasks = next;\n    saveTasks(storage, tasks);\n  }\n\n  return {\n    get items() {\n      return [...tasks];\n    },\n    add(id, input) {\n      const next = addTask(tasks, id, input);\n      if (next !== tasks) {\n        replace(next);\n      }\n    },\n    update(id, changes) {\n      replace(updateTask(tasks, id, changes));\n    },\n    remove(id) {\n      replace(removeTask(tasks, id));\n    },\n    toggleDone(id) {\n      const task = tasks.find((one) => one.id === id);\n      if (task !== undefined) {\n        replace(updateTask(tasks, id, { done: !task.done }));\n      }\n    },\n    countDueBy(day) {\n      return countDueTasks(tasks, day);\n    },\n  };\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
/** The correct repository module with one piece of code replaced. */
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${REPO} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  classToggleOnlySets: broken('    this.update(id, { done: !task.done });', '    this.update(id, { done: true });'),
  classToggleNotSaved: broken('    this.update(id, { done: !task.done });', '    this.#tasks = updateTask(this.#tasks, id, { done: !task.done });'),
  factoryCountWithDone: broken('      return countDueTasks(tasks, day);', '      return tasks.filter((task) => task.dueDate !== null && task.dueDate <= day).length;'),
};

const fixtures = () => [
  { id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.fixture3Name, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.fixture4Name, dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: L.fixture6Name, dueDate: '2026-03-05', done: true, priority: 'low' },
];

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
  const module = await moduleWith('./' + REPO, ['PlannerRepository', 'createPlannerRepository']);
  return [
    ['new PlannerRepository(storage, items)', (store, items) => new module.PlannerRepository(store, items)],
    ['createPlannerRepository(storage, items)', (store, items) => module.createPlannerRepository(store, items)],
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
    expect(Array.isArray(repository?.items) ? ids(repository) : repository?.items, `items of ${design} with the six starting tasks`).toEqual(fixtures().map((task) => task.id));
  }
});

test('both designs keep the list out of reach', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    const own = Object.getOwnPropertyNames(repository).filter((name) => Array.isArray(Object.getOwnPropertyDescriptor(repository, name).value));
    expect(own, `own properties of ${design} that hold an array`).toEqual([]);
    repository.items.push({ id: 't-99' });
    expect(ids(repository).length, `the number of tasks in ${design} after a push into the array that items returned`).toBe(6);
    try {
      repository.items = [];
    } catch (error) {
      // a getter without a setter refuses the assignment
    }
    expect(ids(repository).length, `the number of tasks in ${design} after items = []`).toBe(6);
  }
});

test('both designs add a valid task and refuse an invalid one', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.add('t-7', { title: L.newName, dueDate: '2026-03-04', priority: 'high' });
    expect(repository.items.at(-1), `the last task of ${design} after add("t-7", { title: "${L.newName}", dueDate: "2026-03-04", priority: "high" })`).toEqual({ id: 't-7', title: L.newName, dueDate: '2026-03-04', done: false, priority: 'high' });
    repository.add('t-8', { title: '   ', dueDate: null });
    repository.add('t-9', { title: L.newName, dueDate: null, priority: 'urgent' });
    expect(ids(repository).length, `the number of tasks in ${design} after two invalid drafts`).toBe(7);
  }
});

test('both designs toggle done there and back', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.toggleDone('t-01');
    expect(repository.items[0].done, `done of t-01 in ${design} after one toggleDone("t-01")`).toBe(true);
    repository.toggleDone('t-01');
    expect(repository.items[0].done, `done of t-01 in ${design} after two toggles`).toBe(false);
    repository.toggleDone('t-04');
    expect(repository.items[3].done, `done of t-04 (a done task) in ${design} after one toggle`).toBe(false);
    expect(repository.items.filter((task) => task.id !== 't-04'), `the other tasks of ${design}`).toEqual(fixtures().filter((task) => task.id !== 't-04'));
  }
});

test('both designs save every change', async () => {
  for (const [design, create] of await designs()) {
    const store = memoryStorage();
    const repository = create(store, fixtures());
    const steps = [
      ['add("t-7", …)', () => repository.add('t-7', { title: L.newName, dueDate: null })],
      ['toggleDone("t-01")', () => repository.toggleDone('t-01')],
      ['update("t-02", { priority: "low" })', () => repository.update('t-02', { priority: 'low' })],
      ['remove("t-03")', () => repository.remove('t-03')],
    ];
    for (const [call, run] of steps) {
      run();
      expect(store.saved(), `the saved value of ${KEY} after ${call} of ${design}`).toEqual({ schemaVersion: 1, records: repository.items });
    }
    expect(ids(repository), `the tasks of ${design} after the four calls`).toEqual(['t-01', 't-02', 't-04', 't-05', 't-06', 't-7']);
  }
});

test('both designs count the tasks due by a day', async () => {
  for (const [design, create] of await designs()) {
    // Pending and due on or before 2026-03-02: t-01 and t-02. Done tasks and t-03 (no due date) do not count.
    expect(create(memoryStorage(), fixtures()).countDueBy('2026-03-02'), `countDueBy("2026-03-02") of ${design} with the six starting tasks`).toBe(2);
    expect(create(memoryStorage(), fixtures()).countDueBy('2026-03-10'), `countDueBy("2026-03-10") of ${design} with the six starting tasks`).toBe(3);
    expect(create(memoryStorage(), []).countDueBy('2026-03-02'), `countDueBy("2026-03-02") of ${design} with an empty list`).toBe(0);
    const repository = create(memoryStorage(), fixtures());
    repository.toggleDone('t-02');
    expect(repository.countDueBy('2026-03-02'), `countDueBy("2026-03-02") of ${design} after t-02 became done`).toBe(1);
  }
});

// ---------- checks: the page ----------

test('every card has a button that marks the task done and back', async () => {
  await startPage(null);
  expect(cardButton('t-01', L.markDoneLabel) !== null, `a button "${L.markDoneLabel}" in the card of the pending task t-01`).toBe(true);
  expect(cardButton('t-04', L.markPendingLabel) !== null, `a button "${L.markPendingLabel}" in the card of the done task t-04`).toBe(true);
  await user.click(cardButton('t-01', L.markDoneLabel));
  expect(await until(() => inOrder(cardText('t-01'), L.doneMark)), `"${L.doneMark}" in the card of t-01 after a click on "${L.markDoneLabel}"`).toBe(true);
  expect(cardButton('t-01', L.markPendingLabel) !== null, `a button "${L.markPendingLabel}" in the card of t-01 after that click`).toBe(true);
  expect(inOrder(screen.$('#summary')?.textContent, L.dueSummary, '2026-03-02', '1'), `"${L.dueSummary} 2026-03-02: 1" in the summary after t-01 became done`).toBe(true);
  await user.click(cardButton('t-01', L.markPendingLabel));
  expect(await until(() => cardButton('t-01', L.markDoneLabel) !== null), `a button "${L.markDoneLabel}" in the card of t-01 after the second click`).toBe(true);
  expect(inOrder(cardText('t-01'), L.doneMark), `"${L.doneMark}" in the card of t-01 after the second click`).toBe(false);
});

test('a toggle is saved and survives a restart', async () => {
  const page = await startPage(null);
  await user.click(cardButton('t-02', L.markDoneLabel) ?? document.body);
  expect(await until(() => savedRecord('t-02')?.done === true), `done of t-02 in the saved value of ${KEY} after a click on "${L.markDoneLabel}"`).toBe(true);
  page.start(storage);
  expect(await until(() => inOrder(cardText('t-02'), L.doneMark)), `"${L.doneMark}" in the card of t-02 after a restart`).toBe(true);
});

test('the form and the delete button still change and save the list', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '2026-03-04');
  await user.submit(form());
  expect(await until(() => cards().length === 7), 'seven cards after a new task was saved through the form').toBe(true);
  expect(savedRecords()?.at(-1)?.title, `the title of the last saved task in ${KEY}`).toBe(L.newName);
  await user.click(cardButton('t-03', L.deleteLabel) ?? document.body);
  await user.click(cardButton('t-03', L.confirmDeleteLabel) ?? document.body);
  expect(await until(() => card('t-03') === null), `no card t-03 after "${L.deleteLabel}" and "${L.confirmDeleteLabel}"`).toBe(true);
  expect(savedRecords()?.map((record) => record.id), `the saved ids in ${KEY} after the delete`).toEqual(['t-01', 't-02', 't-04', 't-05', 't-06', 't-7']);
});

// ---------- checks: the learner's tests ----------

test('your repository tests pass with a correct repository', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a class whose toggle only ever sets done', async () => {
  await expectCatches(BROKEN.classToggleOnlySets, 'has a class whose toggleDone only ever sets done to true');
});

test('your tests catch a class whose toggle is not saved', async () => {
  await expectCatches(BROKEN.classToggleNotSaved, 'has a class whose toggleDone does not save');
});

test('your tests catch a factory whose count includes done tasks', async () => {
  await expectCatches(BROKEN.factoryCountWithDone, 'has a factory whose countDueBy also counts done tasks');
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
