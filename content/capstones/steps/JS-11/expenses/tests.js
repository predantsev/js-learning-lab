// Checks of capstone step JS-11, expenses variant: storage/repository.js exports the class
// ExpenseRepository and the factory createExpenseRepository, which behave the same (the same checks
// run on both); the page changes the list only through the repository, also when a card's delete
// button is confirmed; and the learner's tests in tests/repository.test.js run one suite for both designs.
//
// The checks start with an empty storage. Page checks call start(storage) of ui/page.js again,
// which is a restart of the page. The learner's suite is run again with swapped modules: every
// relative import of the project is loaded from a copy, where storage/repository.js is the correct
// or a broken version and tests/testing.js is the course runner (so a changed runner cannot hide a
// failure). While the suite runs, every global of this check harness is hidden.
const KEY = 'jsll.expenses.v1';
const REPO = 'storage/repository.js';
const SUITE = 'tests/repository.test.js';
const RUNNER = 'tests/testing.js';
const DRIVER = 'run-tests.js';
const PAGE = './ui/page.js';
const LIST = '#expenses';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The expense repository: the current list of expenses and its saving, in one place. The same\n// repository is written twice, as a class and as a factory function; both have the same methods\n// and pass the same tests (tests/repository.test.js). The page uses the class.\nimport { addExpense, updateExpense, removeExpense, summarizeExpenses } from \"../domain/expenses.js\";\nimport { saveExpenses } from \"./expenses.js\";\n\n// The class keeps the list and the storage in private fields: code outside the class cannot read\n// or replace them, so every change goes through a method, and every method saves.\nexport class ExpenseRepository {\n  #storage;\n  #expenses;\n\n  constructor(storage, expenses) {\n    this.#storage = storage;\n    this.#expenses = [...expenses];\n  }\n\n  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.\n  get items() {\n    return [...this.#expenses];\n  }\n\n  // Adds an expense if the draft passes validateExpense; an invalid draft changes nothing.\n  add(id, input) {\n    const next = addExpense(this.#expenses, id, input);\n    if (next !== this.#expenses) {\n      this.#expenses = next;\n      saveExpenses(this.#storage, this.#expenses);\n    }\n  }\n\n  update(id, changes) {\n    this.#expenses = updateExpense(this.#expenses, id, changes);\n    saveExpenses(this.#storage, this.#expenses);\n  }\n\n  remove(id) {\n    this.#expenses = removeExpense(this.#expenses, id);\n    saveExpenses(this.#storage, this.#expenses);\n  }\n\n  // The total of every category in minor units: { food, transport, home, fun }.\n  totalByCategory() {\n    return summarizeExpenses(this.#expenses).byCategory;\n  }\n}\n\n// The same repository as a factory: the closure keeps the list and the storage, and the methods\n// use them directly, without `this`. So a method still works when it is passed on alone.\nexport function createExpenseRepository(storage, initialExpenses) {\n  let expenses = [...initialExpenses];\n\n  function replace(next) {\n    expenses = next;\n    saveExpenses(storage, expenses);\n  }\n\n  return {\n    get items() {\n      return [...expenses];\n    },\n    add(id, input) {\n      const next = addExpense(expenses, id, input);\n      if (next !== expenses) {\n        replace(next);\n      }\n    },\n    update(id, changes) {\n      replace(updateExpense(expenses, id, changes));\n    },\n    remove(id) {\n      replace(removeExpense(expenses, id));\n    },\n    totalByCategory() {\n      return summarizeExpenses(expenses).byCategory;\n    },\n  };\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
/** The correct repository module with one piece of code replaced. */
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${REPO} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  classAddSkipsCheck: broken('    const next = addExpense(this.#expenses, id, input);', '    const next = [...this.#expenses, { id: id, ...input }];'),
  classRemoveNotSaved: broken('    this.#expenses = removeExpense(this.#expenses, id);\n    saveExpenses(this.#storage, this.#expenses);', '    this.#expenses = removeExpense(this.#expenses, id);'),
  factoryTotalsOverwrite: broken('      return summarizeExpenses(expenses).byCategory;', '      const totals = { food: 0, transport: 0, home: 0, fun: 0 };\n      for (const expense of expenses) {\n        totals[expense.category] = expense.amountMinor;\n      }\n      return totals;'),
};

const fixtures = () => [
  { id: 'e-01', label: L.fixture1Name, amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: L.fixture2Name, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: L.fixture3Name, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: L.fixture4Name, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: L.fixture5Name, amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: L.fixture6Name, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
/** An amount in minor units as the page shows it (hryvnias, the decimal mark, two digits). */
const money = (amountMinor) => `${Math.floor(amountMinor / 100)}${L.decimalMark}${String(amountMinor % 100).padStart(2, '0')}`;

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
  const module = await moduleWith('./' + REPO, ['ExpenseRepository', 'createExpenseRepository']);
  return [
    ['new ExpenseRepository(storage, items)', (store, items) => new module.ExpenseRepository(store, items)],
    ['createExpenseRepository(storage, items)', (store, items) => module.createExpenseRepository(store, items)],
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
  expect(await until(() => cards().length === 6, 2500), 'six cards of the starting expenses after a start with nothing saved').toBe(true);
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
    expect(Array.isArray(repository?.items) ? ids(repository) : repository?.items, `items of ${design} with the six starting expenses`).toEqual(fixtures().map((expense) => expense.id));
  }
});

test('both designs keep the list out of reach', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    const own = Object.getOwnPropertyNames(repository).filter((name) => Array.isArray(Object.getOwnPropertyDescriptor(repository, name).value));
    expect(own, `own properties of ${design} that hold an array`).toEqual([]);
    repository.items.push({ id: 'e-99' });
    expect(ids(repository).length, `the number of expenses in ${design} after a push into the array that items returned`).toBe(6);
    try {
      repository.items = [];
    } catch (error) {
      // a getter without a setter refuses the assignment
    }
    expect(ids(repository).length, `the number of expenses in ${design} after items = []`).toBe(6);
  }
});

test('both designs add a valid expense and refuse an invalid one', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.add('e-7', { label: L.newName, amountMinor: 4500, date: '2026-03-02', category: 'transport' });
    expect(repository.items.at(-1), `the last expense of ${design} after add("e-7", { label: "${L.newName}", amountMinor: 4500, date: "2026-03-02", category: "transport" })`).toEqual({ id: 'e-7', label: L.newName, amountMinor: 4500, date: '2026-03-02', category: 'transport' });
    repository.add('e-8', { label: '   ', amountMinor: 100, date: '2026-03-02', category: 'food' });
    repository.add('e-9', { label: L.newName, amountMinor: 12.5, date: '2026-03-02', category: 'food' });
    repository.add('e-10', { label: L.newName, amountMinor: 100, date: '2026-03-02', category: 'pets' });
    expect(ids(repository).length, `the number of expenses in ${design} after three invalid drafts`).toBe(7);
  }
});

test('both designs remove one expense', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.remove('e-03');
    expect(ids(repository), `the expenses of ${design} after remove("e-03")`).toEqual(['e-01', 'e-02', 'e-04', 'e-05', 'e-06']);
    repository.remove('e-99');
    expect(ids(repository).length, `the number of expenses in ${design} after remove of an unknown id`).toBe(5);
    expect(repository.items, `the other expenses of ${design}`).toEqual(fixtures().filter((expense) => expense.id !== 'e-03'));
  }
});

test('both designs save every change', async () => {
  for (const [design, create] of await designs()) {
    const store = memoryStorage();
    const repository = create(store, fixtures());
    const steps = [
      ['add("e-7", …)', () => repository.add('e-7', { label: L.newName, amountMinor: 4500, date: '2026-03-02', category: 'transport' })],
      ['update("e-02", { amountMinor: 50000 })', () => repository.update('e-02', { amountMinor: 50000 })],
      ['remove("e-03")', () => repository.remove('e-03')],
    ];
    for (const [call, run] of steps) {
      run();
      expect(store.saved(), `the saved value of ${KEY} after ${call} of ${design}`).toEqual({ schemaVersion: 1, records: repository.items });
    }
    expect(ids(repository), `the expenses of ${design} after the three calls`).toEqual(['e-01', 'e-02', 'e-04', 'e-05', 'e-06', 'e-7']);
  }
});

test('both designs compute the totals by category', async () => {
  for (const [design, create] of await designs()) {
    expect(create(memoryStorage(), fixtures()).totalByCategory(), `totalByCategory() of ${design} with the six starting expenses`).toEqual({ food: 105600, transport: 52000, home: 9990, fun: 48000 });
    expect(create(memoryStorage(), []).totalByCategory(), `totalByCategory() of ${design} with an empty list`).toEqual({ food: 0, transport: 0, home: 0, fun: 0 });
    const repository = create(memoryStorage(), fixtures());
    repository.remove('e-06');
    expect(repository.totalByCategory().food, `the food total of ${design} after remove("e-06")`).toBe(84550);
  }
});

// ---------- checks: the page ----------

test('a confirmed delete removes the card and updates the totals', async () => {
  await startPage(null);
  expect(inOrder(screen.$('#summary')?.textContent, L.categoryFood, money(105600)), `"${L.categoryFood}: ${money(105600)}" in the summary before the delete`).toBe(true);
  await user.click(cardButton('e-06', L.deleteLabel) ?? document.body);
  await user.click(cardButton('e-06', L.confirmDeleteLabel) ?? document.body);
  expect(await until(() => card('e-06') === null), `no card e-06 after "${L.deleteLabel}" and "${L.confirmDeleteLabel}"`).toBe(true);
  expect(inOrder(screen.$('#summary')?.textContent, L.categoryFood, money(84550)), `"${L.categoryFood}: ${money(84550)}" in the summary after e-06 (${money(21050)}) was deleted`).toBe(true);
  expect(inOrder(screen.$('#summary')?.textContent, L.totalLabel, money(194540)), `"${L.totalLabel}: ${money(194540)}" in the summary after that delete`).toBe(true);
  expect(savedRecords()?.map((record) => record.id), `the saved ids in ${KEY} after the delete`).toEqual(['e-01', 'e-02', 'e-03', 'e-04', 'e-05']);
});

test('a delete is saved and survives a restart', async () => {
  const page = await startPage(null);
  await user.click(cardButton('e-02', L.deleteLabel) ?? document.body);
  await user.click(cardButton('e-02', L.confirmDeleteLabel) ?? document.body);
  expect(await until(() => savedRecord('e-01') !== null && savedRecord('e-02') === null), `a saved value of ${KEY} without e-02 after a confirmed delete`).toBe(true);
  page.start(storage);
  await sleep(50);
  expect(await until(() => cards().length === 5 && card('e-02') === null), `five cards and no e-02 after a restart`).toBe(true);
});

test('the form still adds and edits through the repository', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '45');
  await setValue(field(L.dateFieldLabel), '2026-03-02');
  await user.select(field(L.categoryFieldLabel), 'transport');
  await user.submit(form());
  expect(await until(() => cards().length === 7), 'seven cards after a new expense was saved through the form').toBe(true);
  expect(savedRecords()?.at(-1), `the last saved expense in ${KEY}`).toMatchObject({ label: L.newName, amountMinor: 4500, category: 'transport' });
  await user.click(cardButton('e-04', L.editLabel) ?? document.body);
  await setValue(field(L.valueLabel), '120');
  await user.submit(form());
  expect(await until(() => savedRecord('e-04')?.amountMinor === 12000), `amountMinor 12000 for e-04 in ${KEY} after it was edited to 120`).toBe(true);
});

// ---------- checks: the learner's tests ----------

test('your repository tests pass with a correct repository', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a class that adds an invalid draft', async () => {
  await expectCatches(BROKEN.classAddSkipsCheck, 'has a class whose add skips validateExpense');
});

test('your tests catch a class whose remove is not saved', async () => {
  await expectCatches(BROKEN.classRemoveNotSaved, 'has a class whose remove does not save');
});

test('your tests catch a factory whose totals keep only the last expense of a category', async () => {
  await expectCatches(BROKEN.factoryTotalsOverwrite, 'has a factory whose totalByCategory overwrites a category total instead of adding to it');
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
