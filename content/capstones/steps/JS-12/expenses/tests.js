// Checks of capstone step JS-12, expenses variant: a typed amount becomes whole kopiykas without a
// fractional number (parseAmountMinor), a date is a plain "YYYY-MM-DD" text (isCalendarDate with
// anchors); search compares search keys (NFC, trimmed, lower case) of the label; the page shows money
// through Intl.NumberFormat in ui/format.js and per-category totals from a Map (totalsByCategory);
// indexById builds a Map; and the learner's domain tests catch a search key without normalize and an
// amount parser that reads "12,5" as 12 hryvnias and 5 kopiykas.
//
// The checks start with an empty storage; page checks call start(storage) of ui/page.js again (a
// restart). The learner's suite tests/domain.test.js is run again with swapped modules (a correct or
// a broken domain/expenses.js and the course runner), with every global of this harness hidden.
const KEY = 'jsll.expenses.v1';
const DOMAIN = 'domain/expenses.js';
const FORMAT = 'ui/format.js';
const SWAP = DOMAIN;
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const PAGE = './ui/page.js';
const LIST = '#expenses';
const LOCALE = L.formatLocale;
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The rules of an expense: pure functions. No page and no storage here; the starting expenses are\n// in data/expenses.json.\n\n// An amount in whole kopiykas (minor units) as display text: hryvnias and two digits of kopiykas.\nexport function formatAmount(amountMinor) {\n  const kopiykas = amountMinor % 100;\n  const hryvnias = (amountMinor - kopiykas) / 100;\n  const kopiykasText = kopiykas < 10 ? \"0\" + kopiykas : \"\" + kopiykas;\n  return hryvnias + \"%%decimalMark%%\" + kopiykasText;\n}\n\n// The label of an expense: its label, the amount and the currency.\nexport function formatExpenseLabel(expense) {\n  return expense.label + \" — \" + formatAmount(expense.amountMinor) + \" %%currency%%\";\n}\n\n// A calendar date is text of exactly the form \"YYYY-MM-DD\": the anchors ^ and $ refuse anything\n// before or after it, such as a time.\nexport function isCalendarDate(value) {\n  return typeof value === \"string\" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value);\n}\n\n// Typed text of an amount in hryvnias (\"845,50\", \"845.5\" or \"520\") as whole kopiykas, without a\n// fractional number on the way: the hryvnias and the kopiykas are read as two whole numbers.\n// Text of any other form gives NaN, which validateExpense rejects.\nexport function parseAmountMinor(text) {\n  const match = /^(\\d+)(?:[.,](\\d{1,2}))?$/.exec(text.trim());\n  if (match === null) {\n    return NaN;\n  }\n  const kopiykas = (match[2] ?? \"\").padEnd(2, \"0\");\n  return Number(match[1]) * 100 + Number(kopiykas);\n}\n\n// Checks a draft expense. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateExpense(input) {\n  const errors = {};\n\n  const label = (input.label ?? \"\").trim();\n  if (label === \"\") {\n    errors.label = \"required\";\n  } else if (label.length > 80) {\n    errors.label = \"too-long\";\n  }\n\n  // A whole number leaves a remainder of 0 when divided by 1.\n  const amount = input.amountMinor;\n  if (typeof amount !== \"number\" || Number.isNaN(amount) || amount <= 0 || amount % 1 !== 0) {\n    errors.amountMinor = \"not-positive-integer\";\n  }\n\n  // The four categories of the project share one break; anything else is unknown.\n  switch (input.category) {\n    case \"food\":\n    case \"transport\":\n    case \"home\":\n    case \"fun\":\n      break;\n    default:\n      errors.category = \"unknown\";\n  }\n\n  // A date is a plain calendar date \"YYYY-MM-DD\": no time and no time zone.\n  if (!isCalendarDate(input.date)) {\n    errors.date = \"bad-date\";\n  }\n\n  if (errors.label !== undefined || errors.amountMinor !== undefined || errors.category !== undefined || errors.date !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { label: label, amountMinor: amount, date: input.date, category: input.category } };\n}\n\n// A new list with a new expense at the end, if the draft passes the check; otherwise the same list.\nexport function addExpense(list, id, input) {\n  const check = validateExpense(input);\n  if (!check.ok) {\n    return list;\n  }\n  const value = check.value;\n  const expense = { id: id, label: value.label, amountMinor: value.amountMinor, date: value.date, category: value.category };\n  return [...list, expense];\n}\n\n// A new list in which the expense with this id is replaced by a copy with the changes;\n// the other expenses are the same objects.\nexport function updateExpense(list, id, changes) {\n  const result = [];\n  for (const expense of list) {\n    if (expense.id === id) {\n      result.push({ ...expense, ...changes });\n    } else {\n      result.push(expense);\n    }\n  }\n  return result;\n}\n\n// A new list without the expense with this id.\nexport function removeExpense(list, id) {\n  const result = [];\n  for (const expense of list) {\n    if (expense.id !== id) {\n      result.push(expense);\n    }\n  }\n  return result;\n}\n\n// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts\n// that look the same on screen get the same key, however they were typed.\nexport function searchKey(text) {\n  return text.normalize(\"NFC\").trim().toLowerCase();\n}\n\n// The expenses whose label contains the query; both sides are compared by their search key. An\n// empty query keeps every expense.\nexport function searchExpenses(list, query) {\n  const wanted = searchKey(query);\n  return list.filter((expense) => searchKey(expense.label).includes(wanted));\n}\n\n// The expenses of one category.\nexport function filterExpenses(list, category) {\n  return list.filter((expense) => expense.category === category);\n}\n\n// A comparator for one field: amounts by size, dates (\"YYYY-MM-DD\" text) as text.\n// Equal values return 0, so those expenses keep their order.\nfunction byField(field) {\n  return (a, b) => (field === \"amountMinor\" ? a.amountMinor - b.amountMinor : a.date.localeCompare(b.date));\n}\n\n// A copy sorted by \"amountMinor\" or by \"date\"; the received list keeps its order.\nexport function sortExpenses(list, field) {\n  return list.toSorted(byField(field));\n}\n\n// The sum of the amounts of a list, in minor units.\nexport function totalOf(list) {\n  return list.reduce((sum, expense) => sum + expense.amountMinor, 0);\n}\n\n// The total of every category of the project and the overall total, in minor units.\nexport function summarizeExpenses(list) {\n  return {\n    total: totalOf(list),\n    byCategory: {\n      food: totalOf(filterExpenses(list, \"food\")),\n      transport: totalOf(filterExpenses(list, \"transport\")),\n      home: totalOf(filterExpenses(list, \"home\")),\n      fun: totalOf(filterExpenses(list, \"fun\")),\n    },\n  };\n}\n\n// The word for a category of the project.\nexport function categoryText(category) {\n  switch (category) {\n    case \"food\":\n      return \"%%categoryFood%%\";\n    case \"transport\":\n      return \"%%categoryTransport%%\";\n    case \"home\":\n      return \"%%categoryHome%%\";\n    case \"fun\":\n      return \"%%categoryFun%%\";\n    default:\n      return \"\";\n  }\n}\n// The total of every category that has expenses, in minor units: a Map from category to sum, in\n// the order the categories first appear in the list.\nexport function totalsByCategory(list) {\n  const totals = new Map();\n  for (const expense of list) {\n    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountMinor);\n  }\n  return totals;\n}\n\n// An index of the expenses by id: a Map from id to expense, so an expense is found without a pass\n// over the list. If two expenses share an id, the first one stays in the index.\nexport function indexById(list) {\n  const index = new Map();\n  for (const expense of list) {\n    if (!index.has(expense.id)) {\n      index.set(expense.id, expense);\n    }\n  }\n  return index;\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  searchKeyWithoutNormalize: broken('  return text.normalize("NFC").trim().toLowerCase();', '  return text.trim().toLowerCase();'),
  kopiykasNotPadded: broken('  const kopiykas = (match[2] ?? "").padEnd(2, "0");', '  const kopiykas = match[2] ?? "0";'),
};
/** The money text the page must show for an amount in kopiykas. */
const money = (amountMinor, locale = LOCALE) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH' }).format(amountMinor / 100);
const fixtures = () => [
  { id: 'e-01', label: L.fixture1Name, amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: L.fixture2Name, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: L.fixture3Name, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: L.fixture4Name, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: L.fixture5Name, amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: L.fixture6Name, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
// Text typed in two Unicode forms: "й" as one character, and as "и" + a combining breve (U+0306).
const KETTLE = 'Чайник';
const KETTLE_DECOMPOSED = 'Чайник';
const expense = (id, label, category = 'food', amountMinor = 100) => ({ id, label, amountMinor, date: '2026-03-01', category });

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

test('parseAmountMinor reads typed hryvnias as whole kopiykas', async () => {
  const { parseAmountMinor } = await moduleWith('./' + DOMAIN, ['parseAmountMinor']);
  const cases = [['845,50', 84550], ['845.5', 84550], ['0,1', 10], ['0,05', 5], [' 520 ', 52000], ['1,1', 110], ['4.35', 435]];
  for (const [text, expected] of cases) expect(parseAmountMinor(text), `parseAmountMinor("${text}")`).toBe(expected);
  for (const text of ['', '12,345', 'abc', '-5', '1e3', '12,', ',5', '1 000']) {
    expect(Number.isNaN(parseAmountMinor(text)), `parseAmountMinor("${text}") is NaN`).toBe(true);
  }
});

test('validateExpense accepts only a calendar date', async () => {
  const { validateExpense } = await moduleWith('./' + DOMAIN, ['validateExpense']);
  for (const date of ['2026-03-02T10:00', '02.03.2026', '2026-3-2', '', undefined]) {
    expect(validateExpense({ label: L.fixture1Name, amountMinor: 100, date, category: 'food' }), `validateExpense with the date ${JSON.stringify(date)}`).toEqual({ ok: false, errors: { date: 'bad-date' } });
  }
  expect(validateExpense({ label: L.fixture1Name, amountMinor: 100, date: '2026-03-02', category: 'food' }), 'validateExpense with the date "2026-03-02"').toEqual({ ok: true, value: { label: L.fixture1Name, amountMinor: 100, date: '2026-03-02', category: 'food' } });
});

test('searchKey normalizes, trims and lowercases', async () => {
  const { searchKey } = await moduleWith('./' + DOMAIN, ['searchKey']);
  expect(searchKey(`  ${KETTLE_DECOMPOSED.toUpperCase()} `), 'searchKey of " ЧАИ\\u0306НИК " (й as и + U+0306)').toBe(KETTLE.toLowerCase());
  expect(searchKey('Café'), 'searchKey of "Cafe\\u0301" (é as e + U+0301)').toBe('café');
  expect(searchKey(KETTLE), `searchKey of "${KETTLE}"`).toBe(KETTLE.toLowerCase());
});

test('searchExpenses compares search keys of the label', async () => {
  const { searchExpenses } = await moduleWith('./' + DOMAIN, ['searchExpenses']);
  const list = [expense('a', L.fixture1Name), expense('b', `Новий ${KETTLE_DECOMPOSED}`), expense('c', 'Café')];
  const found = (query) => searchExpenses(list, query).map((one) => one.id);
  expect(found('чайник'), 'searchExpenses for "чайник" when the label is stored as "Новий Чаи\\u0306ник"').toEqual(['b']);
  expect(found(' ЧАЙ '), 'searchExpenses for " ЧАИ\\u0306 "').toEqual(['b']);
  expect(found('CAFÉ'), 'searchExpenses for "CAFE\\u0301"').toEqual(['c']);
  expect(found(''), 'searchExpenses for ""').toEqual(['a', 'b', 'c']);
});

test('totalsByCategory sums every category in a Map', async () => {
  const { totalsByCategory } = await moduleWith('./' + DOMAIN, ['totalsByCategory']);
  const totals = totalsByCategory(fixtures());
  expect(totals instanceof Map, 'totalsByCategory(list) is a Map').toBe(true);
  expect([...totals], 'the totals of the six starting expenses, in the order the categories first appear').toEqual([['food', 105600], ['transport', 52000], ['fun', 48000], ['home', 9990]]);
  expect(totalsByCategory([]).size, 'the size of totalsByCategory([])').toBe(0);
});

test('indexById builds a Map from id to expense', async () => {
  const { indexById } = await moduleWith('./' + DOMAIN, ['indexById']);
  const list = fixtures();
  const index = indexById(list);
  expect(index instanceof Map, 'indexById(list) is a Map').toBe(true);
  expect(index.size, 'the size of the index of six expenses').toBe(6);
  expect(index.get('e-03') === list[2], 'index.get("e-03") is the very expense e-03 of the list').toBe(true);
  const twice = indexById([expense('x', L.fixture1Name), expense('x', L.fixture2Name)]);
  expect(twice.get('x')?.label, 'the expense kept for an id that two expenses share').toBe(L.fixture1Name);
});

test('formatMoney shows hryvnias through Intl', async () => {
  const { formatMoney } = await moduleWith('./' + FORMAT, ['formatMoney']);
  for (const locale of ['uk-UA', 'en-US']) {
    for (const amountMinor of [84550, 125000, 5]) expect(formatMoney(amountMinor, locale), `formatMoney(${amountMinor}, "${locale}")`).toBe(money(amountMinor, locale));
  }
});

// ---------- checks: the page ----------

test('the cards and the summary show amounts as money text', async () => {
  await startPage(null);
  expect(inOrder(cardText('e-01'), money(84550)), `"${money(84550)}" in the card of e-01`).toBe(true);
  expect(inOrder(cardText('e-04'), money(9990)), `"${money(9990)}" in the card of e-04`).toBe(true);
  const summary = screen.$('#summary')?.textContent;
  const parts = [L.categoryFood, money(105600), L.categoryTransport, money(52000), L.categoryFun, money(48000), L.categoryHome, money(9990), L.totalLabel, money(215590)];
  expect(inOrder(summary, ...parts), `the summary "${parts.join(' ')}" (the categories in the order they first appear)`).toBe(true);
  expect(savedRecord('e-01'), `the saved value of ${KEY} after only showing the expenses`).toBeNull();
});

test('the form reads a typed amount with a comma', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '45,50');
  await setValue(field(L.dateFieldLabel), '2026-03-02');
  await user.select(field(L.categoryFieldLabel), 'transport');
  await user.submit(form());
  expect(await until(() => cards().length === 7), 'seven cards after "45,50" was saved through the form').toBe(true);
  expect(savedRecords()?.at(-1)?.amountMinor, `amountMinor of the last saved expense in ${KEY} after "45,50"`).toBe(4550);
  expect(inOrder(cardText(cards().at(-1)?.dataset.id), money(4550)), `"${money(4550)}" in the new card`).toBe(true);
});

test('the form refuses an expense without a date', async () => {
  await startPage(null);
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '45');
  await setValue(field(L.dateFieldLabel), '');
  await user.select(field(L.categoryFieldLabel), 'transport');
  await user.submit(form());
  expect(await until(() => inOrder(screen.text(), L.badDateMessage)), `"${L.badDateMessage}" on the page after a draft without a date`).toBe(true);
  expect(cards().length, 'the number of cards after a draft without a date').toBe(6);
  expect(savedRecords(), `the saved value of ${KEY} after a draft without a date`).toBeNull();
});

// ---------- checks: the learner's tests ----------

test('your domain tests pass with a correct domain module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a search key without normalize', async () => {
  await expectCatches(BROKEN.searchKeyWithoutNormalize, 'has a searchKey that does not call normalize("NFC")');
});

test('your tests catch an amount parser that reads "12,5" as 12 hryvnias 5 kopiykas', async () => {
  await expectCatches(BROKEN.kopiykasNotPadded, 'has a parseAmountMinor that reads one digit after the mark as kopiykas ("12,5" gives 1205)');
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
