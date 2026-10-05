// Checks of capstone step JS-11, wishlist variant: storage/repository.js exports the class
// WishlistRepository and the factory createWishlistRepository, which behave the same (the same checks
// run on both); the page changes the list only through the repository and gets a toggle button on
// every card; and the learner's tests in tests/repository.test.js run one suite for both designs.
//
// The checks start with an empty storage. Page checks call start(storage) of ui/page.js again,
// which is a restart of the page. The learner's suite is run again with swapped modules: every
// relative import of the project is loaded from a copy, where storage/repository.js is the correct
// or a broken version and tests/testing.js is the course runner (so a changed runner cannot hide a
// failure). While the suite runs, every global of this check harness is hidden.
const KEY = 'jsll.wishlist.v1';
const REPO = 'storage/repository.js';
const SUITE = 'tests/repository.test.js';
const RUNNER = 'tests/testing.js';
const DRIVER = 'run-tests.js';
const PAGE = './ui/page.js';
const LIST = '#items';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The wishlist repository: the current list of wishes and its saving, in one place. The same\n// repository is written twice, as a class and as a factory function; both have the same methods\n// and pass the same tests (tests/repository.test.js). The page uses the class.\nimport { addItem, updateItem, removeItem, summarizeItems } from \"../domain/wishes.js\";\nimport { saveItems } from \"./wishes.js\";\n\n// The class keeps the list and the storage in private fields: code outside the class cannot read\n// or replace them, so every change goes through a method, and every method saves.\nexport class WishlistRepository {\n  #storage;\n  #items;\n\n  constructor(storage, items) {\n    this.#storage = storage;\n    this.#items = [...items];\n  }\n\n  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.\n  get items() {\n    return [...this.#items];\n  }\n\n  // Adds a wish if the draft passes validateItem; an invalid draft changes nothing.\n  add(id, input) {\n    const next = addItem(this.#items, id, input);\n    if (next !== this.#items) {\n      this.#items = next;\n      saveItems(this.#storage, this.#items);\n    }\n  }\n\n  update(id, changes) {\n    this.#items = updateItem(this.#items, id, changes);\n    saveItems(this.#storage, this.#items);\n  }\n\n  remove(id) {\n    this.#items = removeItem(this.#items, id);\n    saveItems(this.#storage, this.#items);\n  }\n\n  // Acquired becomes wanted, wanted becomes acquired.\n  toggleAcquired(id) {\n    const item = this.#items.find((one) => one.id === id);\n    if (item === undefined) {\n      return;\n    }\n    this.update(id, { acquired: !item.acquired });\n  }\n\n  // The total price of the wanted wishes that have a price.\n  totalWantedPrice() {\n    return summarizeItems(this.#items).wantedTotal;\n  }\n}\n\n// The same repository as a factory: the closure keeps the list and the storage, and the methods\n// use them directly, without `this`. So a method still works when it is passed on alone.\nexport function createWishlistRepository(storage, initialItems) {\n  let items = [...initialItems];\n\n  function replace(next) {\n    items = next;\n    saveItems(storage, items);\n  }\n\n  return {\n    get items() {\n      return [...items];\n    },\n    add(id, input) {\n      const next = addItem(items, id, input);\n      if (next !== items) {\n        replace(next);\n      }\n    },\n    update(id, changes) {\n      replace(updateItem(items, id, changes));\n    },\n    remove(id) {\n      replace(removeItem(items, id));\n    },\n    toggleAcquired(id) {\n      const item = items.find((one) => one.id === id);\n      if (item !== undefined) {\n        replace(updateItem(items, id, { acquired: !item.acquired }));\n      }\n    },\n    totalWantedPrice() {\n      return summarizeItems(items).wantedTotal;\n    },\n  };\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
/** The correct repository module with one piece of code replaced. */
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${REPO} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  classToggleOnlySets: broken('    this.update(id, { acquired: !item.acquired });', '    this.update(id, { acquired: true });'),
  classToggleNotSaved: broken('    this.update(id, { acquired: !item.acquired });', '    this.#items = updateItem(this.#items, id, { acquired: !item.acquired });'),
  factoryTotalWithAcquired: broken('      return summarizeItems(items).wantedTotal;', '      return items.filter((item) => item.price !== null).reduce((sum, item) => sum + item.price, 0);'),
};

const fixtures = () => [
  { id: 'w-01', name: L.fixture1Name, price: 80, acquired: false, category: L.techCategory },
  { id: 'w-02', name: L.fixture2Name, price: 45, acquired: false, category: L.homeCategory },
  { id: 'w-03', name: L.fixture3Name, price: 240, acquired: false, category: L.sportCategory },
  { id: 'w-04', name: L.fixture4Name, price: 25, acquired: true, category: L.booksCategory },
  { id: 'w-05', name: L.fixture5Name, price: null, acquired: false, category: null },
  { id: 'w-06', name: L.fixture6Name, price: 18, acquired: true, category: L.homeCategory },
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
  const module = await moduleWith('./' + REPO, ['WishlistRepository', 'createWishlistRepository']);
  return [
    ['new WishlistRepository(storage, items)', (store, items) => new module.WishlistRepository(store, items)],
    ['createWishlistRepository(storage, items)', (store, items) => module.createWishlistRepository(store, items)],
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
  expect(await until(() => cards().length === 6, 2500), 'six cards of the starting wishes after a start with nothing saved').toBe(true);
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
    expect(Array.isArray(repository?.items) ? ids(repository) : repository?.items, `items of ${design} with the six starting wishes`).toEqual(fixtures().map((item) => item.id));
  }
});

test('both designs keep the list out of reach', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    const own = Object.getOwnPropertyNames(repository).filter((name) => Array.isArray(Object.getOwnPropertyDescriptor(repository, name).value));
    expect(own, `own properties of ${design} that hold an array`).toEqual([]);
    repository.items.push({ id: 'w-99' });
    expect(ids(repository).length, `the number of wishes in ${design} after a push into the array that items returned`).toBe(6);
    try {
      repository.items = [];
    } catch (error) {
      // a getter without a setter refuses the assignment
    }
    expect(ids(repository).length, `the number of wishes in ${design} after items = []`).toBe(6);
  }
});

test('both designs add a valid wish and refuse an invalid one', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.add('w-7', { name: L.newName, price: 30 });
    expect(repository.items.at(-1), `the last wish of ${design} after add("w-7", { name: "${L.newName}", price: 30 })`).toEqual({ id: 'w-7', name: L.newName, price: 30, acquired: false, category: null });
    repository.add('w-8', { name: '   ', price: 10 });
    repository.add('w-9', { name: L.newName, price: -5 });
    expect(ids(repository).length, `the number of wishes in ${design} after two invalid drafts`).toBe(7);
  }
});

test('both designs toggle acquired there and back', async () => {
  for (const [design, create] of await designs()) {
    const repository = create(memoryStorage(), fixtures());
    repository.toggleAcquired('w-01');
    expect(repository.items[0].acquired, `acquired of w-01 in ${design} after one toggleAcquired("w-01")`).toBe(true);
    repository.toggleAcquired('w-01');
    expect(repository.items[0].acquired, `acquired of w-01 in ${design} after two toggles`).toBe(false);
    repository.toggleAcquired('w-04');
    expect(repository.items[3].acquired, `acquired of w-04 (an acquired wish) in ${design} after one toggle`).toBe(false);
    expect(repository.items.filter((item) => item.id !== 'w-04'), `the other wishes of ${design}`).toEqual(fixtures().filter((item) => item.id !== 'w-04'));
  }
});

test('both designs save every change', async () => {
  for (const [design, create] of await designs()) {
    const store = memoryStorage();
    const repository = create(store, fixtures());
    const steps = [
      ['add("w-7", …)', () => repository.add('w-7', { name: L.newName, price: 30 })],
      ['toggleAcquired("w-01")', () => repository.toggleAcquired('w-01')],
      ['update("w-02", { price: 50 })', () => repository.update('w-02', { price: 50 })],
      ['remove("w-03")', () => repository.remove('w-03')],
    ];
    for (const [call, run] of steps) {
      run();
      expect(store.saved(), `the saved value of ${KEY} after ${call} of ${design}`).toEqual({ schemaVersion: 1, records: repository.items });
    }
    expect(ids(repository), `the wishes of ${design} after the four calls`).toEqual(['w-01', 'w-02', 'w-04', 'w-05', 'w-06', 'w-7']);
  }
});

test('both designs compute the wanted total', async () => {
  for (const [design, create] of await designs()) {
    // Wanted with a price: 80 + 45 + 240. The acquired wishes and the wish without a price are left out.
    expect(create(memoryStorage(), fixtures()).totalWantedPrice(), `totalWantedPrice() of ${design} with the six starting wishes`).toBe(365);
    expect(create(memoryStorage(), []).totalWantedPrice(), `totalWantedPrice() of ${design} with an empty list`).toBe(0);
    const repository = create(memoryStorage(), fixtures());
    repository.toggleAcquired('w-03');
    expect(repository.totalWantedPrice(), `totalWantedPrice() of ${design} after w-03 (240) became acquired`).toBe(125);
  }
});

// ---------- checks: the page ----------

test('every card has a button that marks the wish acquired and back', async () => {
  await startPage(null);
  expect(cardButton('w-01', L.markAcquiredLabel) !== null, `a button "${L.markAcquiredLabel}" in the card of the wanted wish w-01`).toBe(true);
  expect(cardButton('w-04', L.markWantedLabel) !== null, `a button "${L.markWantedLabel}" in the card of the acquired wish w-04`).toBe(true);
  await user.click(cardButton('w-01', L.markAcquiredLabel));
  expect(await until(() => inOrder(cardText('w-01'), L.acquiredMark)), `"${L.acquiredMark}" in the card of w-01 after a click on "${L.markAcquiredLabel}"`).toBe(true);
  expect(cardButton('w-01', L.markWantedLabel) !== null, `a button "${L.markWantedLabel}" in the card of w-01 after that click`).toBe(true);
  expect(inOrder(screen.$('#summary')?.textContent, L.summaryWantedTotal, '285'), `"${L.summaryWantedTotal}: 285" in the summary after w-01 (80) became acquired`).toBe(true);
  await user.click(cardButton('w-01', L.markWantedLabel));
  expect(await until(() => cardButton('w-01', L.markAcquiredLabel) !== null), `a button "${L.markAcquiredLabel}" in the card of w-01 after the second click`).toBe(true);
  expect(inOrder(cardText('w-01'), L.acquiredMark), `"${L.acquiredMark}" in the card of w-01 after the second click`).toBe(false);
});

test('a toggle is saved and survives a restart', async () => {
  const page = await startPage(null);
  await user.click(cardButton('w-02', L.markAcquiredLabel) ?? document.body);
  expect(await until(() => savedRecord('w-02')?.acquired === true), `acquired of w-02 in the saved value of ${KEY} after a click on "${L.markAcquiredLabel}"`).toBe(true);
  page.start(storage);
  expect(await until(() => inOrder(cardText('w-02'), L.acquiredMark)), `"${L.acquiredMark}" in the card of w-02 after a restart`).toBe(true);
});

test('the form and the delete button still change and save the list', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '30');
  await user.submit(form());
  expect(await until(() => cards().length === 7), 'seven cards after a new wish was saved through the form').toBe(true);
  expect(savedRecords()?.at(-1)?.name, `the name of the last saved wish in ${KEY}`).toBe(L.newName);
  await user.click(cardButton('w-03', L.deleteLabel) ?? document.body);
  await user.click(cardButton('w-03', L.confirmDeleteLabel) ?? document.body);
  expect(await until(() => card('w-03') === null), `no card w-03 after "${L.deleteLabel}" and "${L.confirmDeleteLabel}"`).toBe(true);
  expect(savedRecords()?.map((record) => record.id), `the saved ids in ${KEY} after the delete`).toEqual(['w-01', 'w-02', 'w-04', 'w-05', 'w-06', 'w-7']);
});

// ---------- checks: the learner's tests ----------

test('your repository tests pass with a correct repository', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a class whose toggle only ever sets acquired', async () => {
  await expectCatches(BROKEN.classToggleOnlySets, 'has a class whose toggleAcquired only ever sets acquired to true');
});

test('your tests catch a class whose toggle is not saved', async () => {
  await expectCatches(BROKEN.classToggleNotSaved, 'has a class whose toggleAcquired does not save');
});

test('your tests catch a factory whose total counts acquired wishes', async () => {
  await expectCatches(BROKEN.factoryTotalWithAcquired, 'has a factory whose totalWantedPrice also adds acquired wishes');
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
