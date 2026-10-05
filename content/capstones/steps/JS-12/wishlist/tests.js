// Checks of capstone step JS-12, wishlist variant: a price is a whole number of hryvnias or null;
// search compares search keys (NFC, trimmed, lower case) of the name and the category; the page shows
// prices through Intl.NumberFormat in ui/format.js; indexById and categoriesInUse build a Map and a
// Set; and the learner's domain tests catch a search key without normalize and a price check that
// accepts fractions.
//
// The checks start with an empty storage; page checks call start(storage) of ui/page.js again (a
// restart). The learner's suite tests/domain.test.js is run again with swapped modules (a correct or
// a broken domain/wishes.js and the course runner), with every global of this harness hidden.
const KEY = 'jsll.wishlist.v1';
const DOMAIN = 'domain/wishes.js';
const FORMAT = 'ui/format.js';
const SWAP = DOMAIN;
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#items';
const LOCALE = L.formatLocale;
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The rules of a wish: pure functions. No page and no storage here; the starting wishes are in\n// data/wishes.json.\n\n// The label of a wish: the name, the price or a fallback text, and a mark when it is acquired.\nexport function formatItemLabel(item) {\n  const label = item.name + \" — \" + (item.price ?? \"%%noPrice%%\");\n  if (item.acquired) {\n    return label + \" · %%acquiredMark%%\";\n  }\n  return label;\n}\n\n// Checks a draft wish. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateItem(input) {\n  const errors = {};\n\n  const name = (input.name ?? \"\").trim();\n  if (name === \"\") {\n    errors.name = \"required\";\n  } else if (name.length > 80) {\n    errors.name = \"too-long\";\n  }\n\n  // A price is a whole number of hryvnias or null: never a fraction such as 12.5.\n  const price = input.price ?? null;\n  if (price !== null && (typeof price !== \"number\" || Number.isNaN(price))) {\n    errors.price = \"not-a-number\";\n  } else if (price !== null && price < 0) {\n    errors.price = \"negative\";\n  } else if (price !== null && !Number.isInteger(price)) {\n    errors.price = \"not-whole\";\n  }\n\n  if (errors.name !== undefined || errors.price !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { name: name, price: price } };\n}\n\n// A new list with a new wish at the end, if the draft passes the check; otherwise the same list.\n// The draft may also carry a category and the acquired flag.\nexport function addItem(list, id, input) {\n  const check = validateItem(input);\n  if (!check.ok) {\n    return list;\n  }\n  const item = { id: id, name: check.value.name, price: check.value.price, acquired: input.acquired === true, category: input.category ?? null };\n  return [...list, item];\n}\n\n// A new list in which the wish with this id is replaced by a copy with the changes;\n// the other wishes are the same objects.\nexport function updateItem(list, id, changes) {\n  const result = [];\n  for (const item of list) {\n    if (item.id === id) {\n      result.push({ ...item, ...changes });\n    } else {\n      result.push(item);\n    }\n  }\n  return result;\n}\n\n// A new list without the wish with this id.\nexport function removeItem(list, id) {\n  const result = [];\n  for (const item of list) {\n    if (item.id !== id) {\n      result.push(item);\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text) {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The wishes whose name or category contains the query; both sides are compared by their search\n// key. An empty query keeps every wish.\nexport function searchItems(list, query) {\n  const wanted = searchKey(query);\n  return list.filter((item) => searchKey(item.name).includes(wanted) || (item.category !== null && searchKey(item.category).includes(wanted)));\n}\n\n// The wanted (\"wanted\") or the acquired (\"acquired\") wishes.\nexport function filterItems(list, status) {\n  const acquired = status === \"acquired\";\n  return list.filter((item) => item.acquired === acquired);\n}\n\n// Comparator: cheaper first, wishes without a price after all priced ones.\n// Equal prices return 0, so those wishes keep their order (the sort is stable).\nfunction byPrice(a, b) {\n  if (a.price === b.price) {\n    return 0;\n  }\n  if (a.price === null) {\n    return 1;\n  }\n  if (b.price === null) {\n    return -1;\n  }\n  return a.price - b.price;\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortItemsByPrice(list) {\n  return list.toSorted(byPrice);\n}\n\n// The summary of a list: the number of wishes, the total price of the wanted wishes that\n// have a price, and how many wanted wishes have no price.\nexport function summarizeItems(list) {\n  const wanted = list.filter((item) => !item.acquired);\n  const priced = wanted.filter((item) => item.price !== null);\n  return {\n    count: list.length,\n    wantedTotal: priced.reduce((sum, item) => sum + item.price, 0),\n    wantedWithoutPrice: wanted.length - priced.length,\n  };\n}\n\n// An index of the wishes by id: a Map from id to wish, so a wish is found without a pass over the\n// list. If two wishes share an id, the first one stays in the index.\nexport function indexById(list) {\n  const index = new Map();\n  for (const item of list) {\n    if (!index.has(item.id)) {\n      index.set(item.id, item);\n    }\n  }\n  return index;\n}\n\n// The categories in use, each once, in the order they first appear; wishes without a category\n// add nothing.\nexport function categoriesInUse(list) {\n  const categories = new Set();\n  for (const item of list) {\n    if (item.category !== null) {\n      categories.add(item.category);\n    }\n  }\n  return categories;\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  searchKeyWithoutNormalize: broken('  return text.normalize("NFC").trim().toLowerCase();', '  return text.trim().toLowerCase();'),
  priceAcceptsFractions: broken('  } else if (price !== null && !Number.isInteger(price)) {\n    errors.price = "not-whole";\n  }\n', '  }\n'),
};
/** The money text the page must show for a whole number of hryvnias. */
const money = (price, locale = LOCALE) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(price);
const fixtures = () => [
  { id: 'w-01', name: L.fixture1Name, price: 80, acquired: false, category: L.techCategory },
  { id: 'w-02', name: L.fixture2Name, price: 45, acquired: false, category: L.homeCategory },
  { id: 'w-03', name: L.fixture3Name, price: 240, acquired: false, category: L.sportCategory },
  { id: 'w-04', name: L.fixture4Name, price: 25, acquired: true, category: L.booksCategory },
  { id: 'w-05', name: L.fixture5Name, price: null, acquired: false, category: null },
  { id: 'w-06', name: L.fixture6Name, price: 18, acquired: true, category: L.homeCategory },
];
// Text typed in two Unicode forms: "й" as one character, and as "и" + a combining breve (U+0306).
const KETTLE = 'Чайник';
const KETTLE_DECOMPOSED = 'Чайник';
const wish = (id, name, category) => ({ id, name, price: 10, acquired: false, category });

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

test('validateItem accepts only whole prices', async () => {
  const { validateItem } = await moduleWith('./' + DOMAIN, ['validateItem']);
  expect(validateItem({ name: L.fixture1Name, price: 12.5 }), 'validateItem with the price 12.5').toEqual({ ok: false, errors: { price: 'not-whole' } });
  expect(validateItem({ name: L.fixture1Name, price: 0.1 + 0.2 }), 'validateItem with the price 0.1 + 0.2').toEqual({ ok: false, errors: { price: 'not-whole' } });
  expect(validateItem({ name: L.fixture1Name, price: -0.5 }), 'validateItem with the price -0.5 (the check for a negative price comes first)').toEqual({ ok: false, errors: { price: 'negative' } });
  expect(validateItem({ name: L.fixture1Name, price: 12 }), 'validateItem with the price 12').toEqual({ ok: true, value: { name: L.fixture1Name, price: 12 } });
  expect(validateItem({ name: L.fixture1Name, price: null }).ok, 'validateItem with the price null').toBe(true);
  expect(validateItem({ name: L.fixture1Name, price: 0 }).ok, 'validateItem with the price 0').toBe(true);
});

test('searchKey normalizes, trims and lowercases', async () => {
  const { searchKey } = await moduleWith('./' + DOMAIN, ['searchKey']);
  expect(searchKey(`  ${KETTLE_DECOMPOSED.toUpperCase()} `), 'searchKey of " ЧАИ\\u0306НИК " (й as и + U+0306)').toBe(KETTLE.toLowerCase());
  expect(searchKey('Café'), 'searchKey of "Cafe\\u0301" (é as e + U+0301)').toBe('café');
  expect(searchKey(KETTLE), `searchKey of "${KETTLE}"`).toBe(KETTLE.toLowerCase());
});

test('searchItems compares search keys of the name and the category', async () => {
  const { searchItems } = await moduleWith('./' + DOMAIN, ['searchItems']);
  const list = [wish('a', L.fixture1Name, null), wish('b', KETTLE_DECOMPOSED, 'Кухня'), wish('c', L.fixture2Name, 'Дім')];
  const found = (query) => searchItems(list, query).map((item) => item.id);
  expect(found('чайник'), `searchItems for "чайник" when the name is stored as "${'Чаи\\u0306ник'}"`).toEqual(['b']);
  expect(found(' ЧАЙ '), 'searchItems for " ЧАИ\\u0306 "').toEqual(['b']);
  expect(found('кухня'), 'searchItems for "кухня" (a category)').toEqual(['b']);
  expect(found(' ДІМ'), 'searchItems for " ДІМ" (a category)').toEqual(['c']);
  expect(found(''), 'searchItems for ""').toEqual(['a', 'b', 'c']);
});

test('indexById builds a Map from id to wish', async () => {
  const { indexById } = await moduleWith('./' + DOMAIN, ['indexById']);
  const list = fixtures();
  const index = indexById(list);
  expect(index instanceof Map, 'indexById(list) is a Map').toBe(true);
  expect(index.size, 'the size of the index of six wishes').toBe(6);
  expect(index.get('w-03') === list[2], 'index.get("w-03") is the very wish w-03 of the list').toBe(true);
  const twice = indexById([wish('x', L.fixture1Name, null), wish('x', L.fixture2Name, null)]);
  expect(twice.get('x')?.name, 'the wish kept for an id that two wishes share').toBe(L.fixture1Name);
  expect(indexById([]).size, 'the size of the index of []').toBe(0);
});

test('categoriesInUse builds a Set of the categories', async () => {
  const { categoriesInUse } = await moduleWith('./' + DOMAIN, ['categoriesInUse']);
  const categories = categoriesInUse(fixtures());
  expect(categories instanceof Set, 'categoriesInUse(list) is a Set').toBe(true);
  expect([...categories], 'the categories of the six starting wishes, in order').toEqual([L.techCategory, L.homeCategory, L.sportCategory, L.booksCategory]);
  expect([...categoriesInUse([wish('a', L.fixture1Name, null)])], 'the categories of a list whose only wish has none').toEqual([]);
});

test('formatPrice shows whole hryvnias through Intl', async () => {
  const { formatPrice } = await moduleWith('./' + FORMAT, ['formatPrice']);
  for (const locale of ['uk-UA', 'en-US']) {
    for (const price of [1250, 80, 0]) expect(formatPrice(price, locale), `formatPrice(${price}, "${locale}")`).toBe(money(price, locale));
  }
});

// ---------- checks: the page ----------

test('the cards and the summary show prices as money text', async () => {
  await startPage(null);
  expect(inOrder(cardText('w-01'), `${L.valueLabel}: ${money(80)}`), `"${L.valueLabel}: ${money(80)}" in the card of w-01`).toBe(true);
  expect(inOrder(cardText('w-03'), `${L.valueLabel}: ${money(240)}`), `"${L.valueLabel}: ${money(240)}" in the card of w-03`).toBe(true);
  expect(inOrder(cardText('w-05'), `${L.valueLabel}: ${L.noPrice}`), `"${L.valueLabel}: ${L.noPrice}" in the card of w-05`).toBe(true);
  expect(inOrder(screen.$('#summary')?.textContent, L.summaryWantedTotal, money(365)), `"${L.summaryWantedTotal}: ${money(365)}" in the summary`).toBe(true);
  expect(savedRecords(), `the saved value of ${KEY} after only showing the wishes`).toBeNull();
});

test('the form refuses a price with a fraction', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '12.5');
  await user.submit(form());
  expect(await until(() => inOrder(screen.text(), L.notWholeMessage)), `"${L.notWholeMessage}" on the page after the price 12.5`).toBe(true);
  expect(cards().length, 'the number of cards after the price 12.5').toBe(6);
  expect(savedRecords(), `the saved value of ${KEY} after the price 12.5`).toBeNull();
  await setValue(field(L.valueLabel), '12');
  await user.submit(form());
  expect(await until(() => cards().length === 7), 'seven cards after the price 12').toBe(true);
});

test('the category field suggests the categories in use', async () => {
  await startPage(null);
  const input = field(L.categoryFieldLabel);
  const options = () => [...(input?.list?.options ?? [])].map((option) => option.value);
  expect(input?.list?.tagName ?? null, `the element named by the list attribute of the field "${L.categoryFieldLabel}"`).toBe('DATALIST');
  expect(options(), 'the suggested categories with the six starting wishes').toEqual([L.techCategory, L.homeCategory, L.sportCategory, L.booksCategory]);
  await setValue(field(L.nameLabel), L.newName);
  await setValue(input, 'Ігри');
  await user.submit(form());
  expect(await until(() => options().length === 5), 'five suggested categories after a wish with the new category "Ігри"').toBe(true);
  expect(options().at(-1), 'the last suggested category').toBe('Ігри');
});

// ---------- checks: the learner's tests ----------

test('your domain tests pass with a correct domain module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a search key without normalize', async () => {
  await expectCatches(BROKEN.searchKeyWithoutNormalize, 'has a searchKey that does not call normalize("NFC")');
});

test('your tests catch a price check that accepts fractions', async () => {
  await expectCatches(BROKEN.priceAcceptsFractions, 'has a validateItem that accepts the price 12.5');
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
