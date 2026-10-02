// Runs the learner's own test file once more, with chosen modules replaced by other versions.
// The rewritten copy imports a fresh copy of testing.js, so its tests never mix with the normal run.
const SUITE_FILE = 'habits.test.js';
const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));

async function runSuite(swaps = {}, options = {}) {
  const source = files[SUITE_FILE];
  if (typeof source !== 'string') throw new Error(`${SUITE_FILE} is missing`);
  const urls = { 'testing.js': moduleUrl(files['testing.js']) };
  for (const [path, code] of Object.entries(swaps)) urls[path] = moduleUrl(code);
  const rewritten = source.replace(/(["'])\.\/([\w./-]+)\1/g, (match, quote, path) => JSON.stringify(urls[path] ?? `~/${path}`));
  // While the learner's tests run, the checker's own test/expect globals are hidden: a test file
  // that forgot to import them must fail here exactly as it does on Run.
  const hidden = { test: window.test, expect: window.expect };
  delete window.test;
  delete window.expect;
  try {
    await import(moduleUrl(rewritten));
    const runner = await import(urls['testing.js']);
    return await runner.run({ print: false, ...options });
  } finally {
    Object.assign(window, hidden);
  }
}

const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

async function expectSuitePasses(swaps = {}) {
  const results = await runSuite(swaps);
  expect(results.length, `number of tests in ${SUITE_FILE}`).toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail with the correct code').toEqual([]);
}

async function expectSuiteCatches(swaps) {
  await expectSuitePasses();
  const results = await runSuite(swaps);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

// A reference completedSince and the reported defect, to judge the test file on its own.
const reference = `export function completedSince(habit, from) {
  return habit.completions.filter((day) => day >= from).length;
}`;
const reported = reference.replace('day >= from', 'day > from');

const completedSince = async () => {
  const habits = await import('./habits.js');
  expect(typeof habits.completedSince, 'type of the completedSince export of habits.js').toBe('function');
  return habits.completedSince;
};
const habitWith = (completions) => ({ id: 'h-90', name: 'x', frequency: 'daily', active: true, completions });

test('completedSince counts a completion made on the day from', async () => {
  const count = await completedSince();
  expect(count(habitWith(['2026-03-08', '2026-03-09']), '2026-03-08'), 'completedSince(habit, its first day)').toBe(2);
});

test('completedSince leaves out earlier days and gives 0 for no completions', async () => {
  const count = await completedSince();
  expect(count(habitWith(['2026-03-06', '2026-03-07', '2026-03-09']), '2026-03-08'), 'one day after from').toBe(1);
  expect(count(habitWith([]), '2026-03-08'), 'no completions').toBe(0);
});

test('your tests pass in the order they are written', async () => {
  await expectSuitePasses({ 'habits.js': reference });
});

test('your tests pass in reverse order too', async () => {
  const results = await runSuite({ 'habits.js': reference }, { reverse: true });
  expect(results.length, 'number of tests in habits.test.js').toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail when run in reverse order').toEqual([]);
});

test('your tests still catch the reported defect', async () => {
  await expectSuitePasses({ 'habits.js': reference });
  const results = await runSuite({ 'habits.js': reported });
  expect(results.some((result) => !result.passed), 'at least one of your tests fails when the first day is dropped').toBe(true);
});
