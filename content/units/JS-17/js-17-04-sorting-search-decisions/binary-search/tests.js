import * as dates from './dates.js';

const search = () => {
  expect(typeof dates.binarySearchByDate, 'type of the binarySearchByDate export of dates.js').toBe('function');
  return dates.binarySearchByDate;
};
const summaries = () =>
  ['2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'].map((date, i) => ({ date, totalMinor: 1000 * (i + 1) }));

test('finds the first, a middle and the last summary', () => {
  const list = summaries();
  expect(search()(list, '2026-02-24'), 'the result for the first date').toBe(list[0]);
  expect(search()(list, '2026-02-27'), 'the result for a date in the middle').toBe(list[3]);
  expect(search()(list, '2026-03-02'), 'the result for the last date').toBe(list[6]);
});

test('a date that is not in the list gives null', () => {
  const list = summaries();
  expect(search()(list, '2026-02-29'), 'the result for 2026-02-29 (between two dates)').toBe(null);
  expect(search()(list, '2026-01-01'), 'the result for a date before the first').toBe(null);
  expect(search()(list, '2026-04-01'), 'the result for a date after the last').toBe(null);
});

test('an empty list and a list of one summary', () => {
  const one = [{ date: '2026-03-01', totalMinor: 500 }];
  expect(search()([], '2026-03-01'), 'the result for an empty list').toBe(null);
  expect(search()(one, '2026-03-01'), 'the result for the only summary').toBe(one[0]);
  expect(search()(one, '2026-03-02'), 'the result for a missing date in a list of one').toBe(null);
});

test('it reads only a few dates of 100,000 summaries', () => {
  let reads = 0;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const list = [];
  for (let i = 0; i < 100000; i++) {
    const date = new Date(Date.UTC(1900, 0, 1) + i * DAY_MS).toISOString().slice(0, 10);
    list.push({ totalMinor: i, get date() { reads += 1; return date; } });
  }
  const target = new Date(Date.UTC(1900, 0, 1) + 76543 * DAY_MS).toISOString().slice(0, 10);
  const found = search()(list, target);
  expect(found?.totalMinor, 'the summary found for the 76,544th date').toBe(76543);
  expect(reads, 'how many times a date was read').toBeLessThanOrEqual(60);
});

test('the Precondition comment says what sortedRecords must be', () => {
  const source = typeof files['dates.js'] === 'string' ? files['dates.js'] : '';
  const start = source.indexOf('Precondition:');
  expect(start >= 0, 'dates.js has a comment with "Precondition:"').toBe(true);
  const end = source.indexOf('export function', start);
  const said = source
    .slice(start + 'Precondition:'.length, end < 0 ? undefined : end)
    .replace(/\/\/|\/\*|\*\/|\*/g, ' ')
    .trim();
  expect(said.includes('write here'), 'the Precondition comment still holds the starter placeholder').toBe(false);
  expect(said.split(/\s+/).filter(Boolean).length, 'words written after "Precondition:"').toBeGreaterThanOrEqual(3);
});

// ---- your tests in dates.test.js, run against a correct search and against broken ones ----
const SUITE_FILE = 'dates.test.js';
const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
const REFERENCE = `export function binarySearchByDate(sortedRecords, date) {
  let low = 0;
  let high = sortedRecords.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const middleDate = sortedRecords[middle].date;
    if (middleDate === date) return sortedRecords[middle];
    if (middleDate < date) low = middle + 1;
    else high = middle - 1;
  }
  return null;
}
`;
const swap = (from, to) => {
  if (!REFERENCE.includes(from)) throw new Error(`the reference search does not contain: ${from}`);
  return REFERENCE.replace(from, to);
};
const BROKEN = {
  missesLast: swap('while (low <= high)', 'while (low < high)'),
  missesFirst: swap('let low = 0;', 'let low = 1;'),
  neighbourForMissing: swap('  return null;\n}', '  return sortedRecords[low] ?? null;\n}'),
};

async function runSuite(searchModule) {
  const source = files[SUITE_FILE];
  if (typeof source !== 'string') throw new Error(`${SUITE_FILE} is missing`);
  const urls = { 'testing.js': moduleUrl(files['testing.js']), 'dates.js': moduleUrl(searchModule) };
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
  const results = await runSuite(REFERENCE);
  expect(results.length, `number of tests in ${SUITE_FILE}`).toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail with a correct binary search').toEqual([]);
}
async function expectSuiteCatches(broken) {
  await expectSuitePasses();
  const results = await runSuite(broken);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken search').toBe(true);
}

test('your tests pass with a correct binary search', async () => {
  await expectSuitePasses();
});

test('one of your tests fails when the last summary is never found', async () => {
  await expectSuiteCatches(BROKEN.missesLast);
});

test('one of your tests fails when the first summary is never found', async () => {
  await expectSuiteCatches(BROKEN.missesFirst);
});

test('one of your tests fails when a missing date returns a neighbouring summary', async () => {
  await expectSuiteCatches(BROKEN.neighbourForMissing);
});
