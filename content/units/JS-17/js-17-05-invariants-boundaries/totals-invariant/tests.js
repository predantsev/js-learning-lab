import * as invariant from './invariant.js';
import { buildTotals } from './totals.js';

const check = () => {
  expect(typeof invariant.assertInvariant, 'type of the assertInvariant export of invariant.js').toBe('function');
  return invariant.assertInvariant;
};
const fixtures = () => [
  { id: 'e-01', label: L.groceries, amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: L.pass, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
const thrown = (run) => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
};
const describe = (error) => (error === null ? null : `${error.name}: ${error.message}`);

test('accepts a consistent index, also an empty one', () => {
  const assertInvariant = check();
  expect(describe(thrown(() => assertInvariant(buildTotals(fixtures())))), 'error for the index of three expenses').toBe(null);
  expect(describe(thrown(() => assertInvariant(buildTotals([])))), 'error for the index of no expenses').toBe(null);
});

test('throws when overall is not the sum of the category totals', () => {
  const assertInvariant = check();
  const totals = buildTotals(fixtures());
  totals.overall = totals.overall + 1;
  expect(thrown(() => assertInvariant(totals)) instanceof Error, 'an Error for overall that is 1 too big').toBe(true);
});

test('throws when a category total does not match its records', () => {
  const assertInvariant = check();
  const totals = buildTotals(fixtures());
  totals.byCategory.set('food', totals.byCategory.get('food') + 1);
  totals.overall = totals.overall + 1;
  expect(thrown(() => assertInvariant(totals)) instanceof Error, 'an Error for a food total that is 1 too big (overall raised to match)').toBe(true);
});

test('throws when a category of the records has no total', () => {
  const assertInvariant = check();
  const totals = buildTotals(fixtures());
  totals.overall = totals.overall - totals.byCategory.get('transport');
  totals.byCategory.delete('transport');
  expect(thrown(() => assertInvariant(totals)) instanceof Error, 'an Error when transport has records but no total').toBe(true);
});

test('throws when a category has a total but no records', () => {
  const assertInvariant = check();
  const totals = buildTotals(fixtures());
  totals.byCategory.set('fun', 500);
  totals.overall = totals.overall + 500;
  expect(thrown(() => assertInvariant(totals)) instanceof Error, 'an Error when fun has a total of 500 but no records (overall raised to match)').toBe(true);
});

test('throws when a record is stored under another id', () => {
  const assertInvariant = check();
  const totals = buildTotals(fixtures());
  const moved = totals.records.get('e-02');
  totals.records.delete('e-02');
  totals.records.set('e-99', moved);
  expect(thrown(() => assertInvariant(totals)) instanceof Error, 'an Error when e-02 is stored under e-99').toBe(true);
});

test('does not change the index', () => {
  const assertInvariant = check();
  const totals = buildTotals(fixtures());
  const before = JSON.stringify([[...totals.records], [...totals.byCategory], totals.overall]);
  thrown(() => assertInvariant(totals));
  expect(JSON.stringify([[...totals.records], [...totals.byCategory], totals.overall]), 'the index after assertInvariant').toBe(before);
});

// ---- your tests in totals.test.js, run against the real totals.js and against broken ones ----
const SUITE_FILE = 'totals.test.js';
const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const REFERENCE_INVARIANT = fill("// assertInvariant(totals) returns nothing when the index is consistent and throws an Error\n// with a clear message when it is not. The invariant of the index:\n// 1. every record is stored under its own id;\n// 2. the total of every category equals the sum of amountMinor of the records in that category\n//    (a category without records cannot have a total other than 0), and every category of the\n//    records has a total;\n// 3. overall equals the sum of the category totals.\n// It does not change the index.\nexport function assertInvariant(totals) {\n  const fromRecords = new Map();\n  for (const [id, expense] of totals.records) {\n    if (expense.id !== id) {\n      throw new Error(`%%wrongKey%% ${id} \u2192 ${expense.id}`);\n    }\n    fromRecords.set(expense.category, (fromRecords.get(expense.category) ?? 0) + expense.amountMinor);\n  }\n  for (const [category, sum] of fromRecords) {\n    if (totals.byCategory.get(category) !== sum) {\n      throw new Error(`%%wrongCategory%% ${category}: ${totals.byCategory.get(category)} \u2260 ${sum}`);\n    }\n  }\n  for (const [category, total] of totals.byCategory) {\n    if (total !== (fromRecords.get(category) ?? 0)) {\n      throw new Error(`%%wrongCategory%% ${category}: ${total} \u2260 ${fromRecords.get(category) ?? 0}`);\n    }\n  }\n  let overall = 0;\n  for (const total of totals.byCategory.values()) {\n    overall = overall + total;\n  }\n  if (overall !== totals.overall) {\n    throw new Error(`%%wrongOverall%% ${totals.overall} \u2260 ${overall}`);\n  }\n}\n");
const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
const real = () => files['totals.js'];
const swap = (from, to) => {
  const text = fill(from);
  if (!real().includes(text)) throw new Error(`totals.js no longer contains: ${text}`);
  return real().replace(text, fill(to));
};

const ALWAYS_THROWS = 'export function assertInvariant() {\n  throw new Error("assertInvariant was called");\n}\n';

async function runSuite(totalsModule, invariantModule = REFERENCE_INVARIANT) {
  const source = files[SUITE_FILE];
  if (typeof source !== 'string') throw new Error(`${SUITE_FILE} is missing`);
  const urls = { 'testing.js': moduleUrl(files['testing.js']), 'totals.js': moduleUrl(totalsModule), 'invariant.js': moduleUrl(invariantModule) };
  const rewritten = source.replace(/(["'])\.\/([\w./-]+)\1/g, (match, quote, path) => JSON.stringify(urls[path] ?? `~/${path}`));
  const hidden = { test: window.test, expect: window.expect };
  delete window.test;
  delete window.expect;
  try {
    await import(moduleUrl(rewritten));
    const runner = await import(urls['testing.js']);
    return await runner.run({ print: false });
  } finally {
    Object.assign(window, hidden);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
async function expectSuitePasses() {
  const results = await runSuite(real());
  expect(results.length, `number of tests in ${SUITE_FILE}`).toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail with the real totals.js').toEqual([]);
}
async function expectSuiteCatches(broken) {
  await expectSuitePasses();
  const results = await runSuite(broken);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken totals.js').toBe(true);
}

test('your tests pass with the real totals.js', async () => {
  await expectSuitePasses();
});

test('one of your tests fails when an empty list of expenses crashes', async () => {
  await expectSuiteCatches(swap('  return { records, byCategory, overall };', '  return { records, byCategory, overall: expenses.slice(1).reduce((sum, expense) => sum + expense.amountMinor, expenses[0].amountMinor) };'));
});

test('one of your tests fails when addExpense accepts an id that is already there', async () => {
  await expectSuiteCatches(swap('  if (totals.records.has(expense.id)) {\n    throw new Error(`%%duplicateId%% ${expense.id}`);\n  }\n  const records = new Map(totals.records)', '  const records = new Map(totals.records)'));
});

test('one of your tests fails when buildTotals stops after 1,000 expenses', async () => {
  await expectSuiteCatches(swap('  for (const expense of expenses) {', '  for (const expense of expenses.slice(0, 1000)) {'));
});

test('every one of your tests calls assertInvariant', async () => {
  await expectSuitePasses();
  const results = await runSuite(real(), ALWAYS_THROWS);
  expect(results.filter((result) => result.passed).map((result) => result.name), 'your tests that still pass when assertInvariant always throws').toEqual([]);
});
