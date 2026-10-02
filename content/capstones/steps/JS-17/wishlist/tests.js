// Checks of capstone step JS-17, wishlist variant: data/synthetic.js makes many valid records the same way
// every time; duplicateNames in domain/wishes.ts reads each record only a few times (an index instead of a
// pass per item) and gives the same result as before; the page uses it; the main action is
// announced in a status region; a field with an error is marked invalid and linked to its message;
// and the learner's characterization tests catch a seeded defect of the indexed version.
//
// Work is measured by counting reads (a getter or a Proxy counts them), never by time. The checks
// start with an empty storage; page checks call start(storage) of ui/page.js again (a restart).
const KEY = 'jsll.wishlist.v1';
const DOMAIN = 'domain/wishes.ts';
const SYNTH = './data/synthetic.js';
const STORAGE = './storage/wishes.ts';
const SWAP = DOMAIN;
const SUITE = 'tests/performance.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#items';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
// The course's domain module with its types removed (a browser cannot run TypeScript from a blob).
const CORRECT = fill("// The rules of a wish: pure functions with types. No page and no storage here; the starting wishes\n// are in data/wishes.json. The types exist only for tsc: the platform and Node.js remove them before\n// running, so a value that comes from outside (storage, a file) is still checked at runtime.\n\n// ---------- types ----------\n\n                    \n                      \n               \n                                                                             \n                    \n                          \n  \n\n// A draft from the form: every field may be missing.\n                         \n                \n                        \n                           \n                     \n  \n\n                                                                                               \n\n                          \n                      \n                       \n  \n\n// The result of validateItem: exactly one of the two shapes. `ok` tells them apart, so after\n// `if (check.ok)` tsc knows that `check.value` exists, and otherwise `check.errors`.\n                              \n                                                               \n                                      \n\n                                               \n\n                           \n                \n                      \n                             \n  \n\n// ---------- rules ----------\n\n// The label of a wish: the name, the price or a fallback text, and a mark when it is acquired.\nexport function formatItemLabel(item      )         {\n  const label = item.name + \" — \" + (item.price ?? \"%%noPrice%%\");\n  if (item.acquired) {\n    return label + \" · %%acquiredMark%%\";\n  }\n  return label;\n}\n\n// Checks a draft wish. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateItem(input           )                   {\n  const errors             = {};\n\n  const name = (input.name ?? \"\").trim();\n  if (name === \"\") {\n    errors.name = \"required\";\n  } else if (name.length > 80) {\n    errors.name = \"too-long\";\n  }\n\n  // A price is a whole number of hryvnias or null: never a fraction such as 12.5.\n  const price = input.price ?? null;\n  if (price !== null && (typeof price !== \"number\" || Number.isNaN(price))) {\n    errors.price = \"not-a-number\";\n  } else if (price !== null && price < 0) {\n    errors.price = \"negative\";\n  } else if (price !== null && !Number.isInteger(price)) {\n    errors.price = \"not-whole\";\n  }\n\n  if (errors.name !== undefined || errors.price !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { name: name, price: price } };\n}\n\n// A new list with a new wish at the end, if the draft passes the check; otherwise the same list.\n// The draft may also carry a category and the acquired flag.\nexport function addItem(list        , id        , input           )         {\n  const check = validateItem(input);\n  if (!check.ok) {\n    return list;\n  }\n  const item       = { id: id, name: check.value.name, price: check.value.price, acquired: input.acquired === true, category: input.category ?? null };\n  return [...list, item];\n}\n\n// A new list in which the wish with this id is replaced by a copy with the changes;\n// the other wishes are the same objects. The id itself cannot be changed.\nexport function updateItem(list        , id        , changes                           )         {\n  const result         = [];\n  for (const item of list) {\n    if (item.id === id) {\n      result.push({ ...item, ...changes });\n    } else {\n      result.push(item);\n    }\n  }\n  return result;\n}\n\n// A new list without the wish with this id.\nexport function removeItem(list        , id        )         {\n  const result         = [];\n  for (const item of list) {\n    if (item.id !== id) {\n      result.push(item);\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text        )         {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The wishes whose name or category contains the query; both sides are compared by their search\n// key. An empty query keeps every wish.\nexport function searchItems(list        , query        )         {\n  const wanted = searchKey(query);\n  return list.filter((item) => searchKey(item.name).includes(wanted) || (item.category !== null && searchKey(item.category).includes(wanted)));\n}\n\n// The wanted (\"wanted\") or the acquired (\"acquired\") wishes.\nexport function filterItems(list        , status            )         {\n  const acquired = status === \"acquired\";\n  return list.filter((item) => item.acquired === acquired);\n}\n\n// Comparator: cheaper first, wishes without a price after all priced ones.\n// Equal prices return 0, so those wishes keep their order (the sort is stable).\nfunction byPrice(a      , b      )         {\n  if (a.price === b.price) {\n    return 0;\n  }\n  if (a.price === null) {\n    return 1;\n  }\n  if (b.price === null) {\n    return -1;\n  }\n  return a.price - b.price;\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortItemsByPrice(list        )         {\n  return list.toSorted(byPrice);\n}\n\n// A type predicate: after filter(hasPrice), tsc knows that every price is a number.\nfunction hasPrice(item      )                                   {\n  return item.price !== null;\n}\n\n// The summary of a list: the number of wishes, the total price of the wanted wishes that\n// have a price, and how many wanted wishes have no price.\nexport function summarizeItems(list        )              {\n  const wanted = list.filter((item) => !item.acquired);\n  const priced = wanted.filter(hasPrice);\n  return {\n    count: list.length,\n    wantedTotal: priced.reduce((sum, item) => sum + item.price, 0),\n    wantedWithoutPrice: wanted.length - priced.length,\n  };\n}\n\n// An index by id: a Map from id to record, so a record is found without a pass over the list. It\n// is generic: it works for any records with a text id, and the Map keeps their type. If two\n// records share an id, the first one stays in the index.\nexport function indexById                                   (list              )                 {\n  const index = new Map           ();\n  for (const item of list) {\n    if (!index.has(item.id)) {\n      index.set(item.id, item);\n    }\n  }\n  return index;\n}\n\n// The categories in use, each once, in the order they first appear; wishes without a category\n// add nothing.\nexport function categoriesInUse(list        )              {\n  const categories = new Set        ();\n  for (const item of list) {\n    if (item.category !== null) {\n      categories.add(item.category);\n    }\n  }\n  return categories;\n}\n\n// The items in pages of `size`, one page at a time: the generator builds a page only when the next\n// one is asked for, so a page that is never shown is never built. An empty list yields no page.\nexport function* paginate   (items              , size        )                 {\n  for (let start = 0; start < items.length; start += size) {\n    yield items.slice(start, start + size);\n  }\n}\n\n// The search keys of the names that more than one wish has. One pass with two Sets — the keys seen\n// so far and the keys seen again — so every name is read once: the work grows with the length of\n// the list, not with its square.\nexport function duplicateNames(list                 )              {\n  const seen = new Set        ();\n  const repeated = new Set        ();\n  for (const item of list) {\n    const key = searchKey(item.name);\n    if (seen.has(key)) {\n      repeated.add(key);\n    } else {\n      seen.add(key);\n    }\n  }\n  return repeated;\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  wrongKey: broken('    const key = searchKey(item.name);\n    if (seen.has(key)) {', '    const key = item.name;\n    if (seen.has(key)) {'),
};
const fixtures = () => [
  { id: 'w-01', name: L.fixture1Name, price: 80, acquired: false, category: L.techCategory },
  { id: 'w-02', name: L.fixture2Name, price: 45, acquired: false, category: L.homeCategory },
  { id: 'w-03', name: L.fixture3Name, price: 240, acquired: false, category: L.sportCategory },
  { id: 'w-04', name: L.fixture4Name, price: 25, acquired: true, category: L.booksCategory },
  { id: 'w-05', name: L.fixture5Name, price: null, acquired: false, category: null },
  { id: 'w-06', name: L.fixture6Name, price: 18, acquired: true, category: L.homeCategory },
];
const saved = (records) => JSON.stringify({ schemaVersion: 1, records });
/** Copies of the records whose `field` is a getter that counts its reads. */
function counted(records, field) {
  const counter = { reads: 0 };
  const list = records.map((record) => {
    const copy = { ...record };
    const value = copy[field];
    delete copy[field];
    Object.defineProperty(copy, field, { enumerable: true, get() { counter.reads += 1; return value; } });
    return copy;
  });
  return { list, counter };
}
/** The repeated search keys, computed here independently of the learner's code. */
function referenceDuplicates(list) {
  const key = (text) => text.normalize('NFC').trim().toLowerCase();
  const counts = new Map();
  for (const item of list) counts.set(key(item.name), (counts.get(key(item.name)) ?? 0) + 1);
  return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name));
}

/** A status region (role="status" or aria-live) shows exactly this text. */
const announced = (text) => [...document.querySelectorAll('[role="status"], [aria-live]')].some((node) => norm(node.textContent) === norm(text));
/** The text of the elements that aria-describedby of `node` names. */
const describedBy = (node) => (node?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');

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
  expect(cards().length, 'the number of cards after a start (the first page of the six starting wishes)').toBe(4);
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

// ---------- checks: measuring ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the synthetic generator makes 20,000 valid records, the same every time', async () => {
  const { makeSyntheticWishes } = await moduleWith(SYNTH, ['makeSyntheticWishes']);
  const { isUsableItem } = await moduleWith(STORAGE, ['isUsableItem']);
  const list = makeSyntheticWishes(20000);
  const expected = 20000;
  expect(list.length, 'the number of records').toBe(expected);
  expect(new Set(list.map((record) => record.id)).size, 'the number of different ids').toBe(expected);
  expect(list.filter((record) => !isUsableItem(record)).length, 'records that isUsableItem refuses').toBe(0);
  expect(JSON.stringify(makeSyntheticWishes(300)) === JSON.stringify(makeSyntheticWishes(300)), 'two calls with the same arguments give the same records').toBe(true);
});

test('duplicateNames reads each name only a few times', async () => {
  const { duplicateNames } = await moduleWith('./' + DOMAIN, ['duplicateNames']);
  const { makeSyntheticWishes } = await moduleWith(SYNTH, ['makeSyntheticWishes']);
  const plain = makeSyntheticWishes(2000);
  const { list, counter } = counted(plain, 'name');
  const result = duplicateNames(list);
  expect(counter.reads, 'reads of name during duplicateNames of 2,000 wishes (at most 6,000)').toBeLessThanOrEqual(6000);
  expect([...result].sort(), 'the repeated names of the 2,000 synthetic wishes').toEqual([...referenceDuplicates(plain)].sort());
});

test('duplicateNames finds names that repeat, whatever the case and the Unicode form', async () => {
  const { duplicateNames } = await moduleWith('./' + DOMAIN, ['duplicateNames']);
  const wish = (id, name) => ({ id, name, price: 1, acquired: false, category: null });
  const result = duplicateNames([wish('a', 'Чайник'), wish('b', ' ЧАИ\u0306НИК '), wish('c', L.fixture1Name), wish('d', L.fixture2Name), wish('e', L.fixture2Name)]);
  expect(result instanceof Set, 'duplicateNames(list) is a Set').toBe(true);
  expect([...result].sort(), 'the repeated names (as search keys)').toEqual(['чайник', L.fixture2Name.toLowerCase()].sort());
  expect(duplicateNames(fixtures()).size, 'repeated names among the six starting wishes').toBe(0);
});

// ---------- checks: the page ----------

test('a card says when another wish has the same name', async () => {
  await startPage(saved([...fixtures(), { id: 'w-07', name: '  ' + L.fixture2Name.toUpperCase(), price: 5, acquired: false, category: null }]));
  expect(inOrder(cardText('w-02'), L.duplicateMark), `"${L.duplicateMark}" in the card of w-02, whose name w-07 repeats`).toBe(true);
  expect(inOrder(cardText('w-01'), L.duplicateMark), `"${L.duplicateMark}" in the card of w-01`).toBe(false);
});

test('the main action is announced in a status region', async () => {
  await startPage(null);
  await user.click(cardButton('w-01', L.markAcquiredLabel) ?? document.body);
  expect(await until(() => announced(L.announceAcquired.replace('{name}', L.fixture1Name))), `"${L.announceAcquired.replace('{name}', L.fixture1Name)}" in a status region after "${L.markAcquiredLabel}"`).toBe(true);
  await user.click(cardButton('w-01', L.markWantedLabel) ?? document.body);
  expect(await until(() => announced(L.announceWanted.replace('{name}', L.fixture1Name))), `"${L.announceWanted.replace('{name}', L.fixture1Name)}" in a status region after "${L.markWantedLabel}"`).toBe(true);
});

test('a field with an error is marked invalid and linked to its message', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), '   ');
  await user.submit(form());
  const input = field(L.nameLabel);
  expect(input?.getAttribute('aria-invalid'), `aria-invalid of the field "${L.nameLabel}" after an empty draft`).toBe('true');
  expect(inOrder(describedBy(input), L.requiredMessage), `the message "${L.requiredMessage}" in the text that aria-describedby of the field names`).toBe(true);
  await setValue(field(L.nameLabel), L.newName);
  await user.submit(form());
  expect(await until(() => input.getAttribute('aria-invalid') !== 'true'), `aria-invalid of the field "${L.nameLabel}" after a valid draft (absent or "false")`).toBe(true);
});

// ---------- checks: the learner's tests ----------

test('your performance tests pass with a correct domain module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch duplicates compared without the search key', async () => {
  await expectCatches(BROKEN.wrongKey, 'has a duplicateNames that compares the names as they are, not their search keys');
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
