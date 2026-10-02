// Runs the learner's own test file once more, with chosen modules replaced by other versions.
// The rewritten copy imports a fresh copy of testing.js, so its tests never mix with the normal run.
const SUITE_FILE = 'tasks.test.js';
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

async function expectSuitePasses(options = {}) {
  const results = await runSuite({}, options);
  expect(results.length, `number of tests in ${SUITE_FILE}`).toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail with the correct code').toEqual([]);
}

async function expectSuiteCatches(swaps) {
  await expectSuitePasses();
  const results = await runSuite(swaps);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

// Broken versions of tasks.js. Each keeps everything else exactly as in the real file.
const real = files['tasks.js'];
const sortsInPlace = real
  .replace('return tasks.toSorted(compareByDue);', 'return tasks.sort(compareByDue);')
  .replace('return tasks.toSorted((a, b) =>', 'return tasks.sort((a, b) =>');
const neverThrows = real.replace(/throw new RangeError\(.*\);/, 'return [...tasks];');
const latestFirst = real.replace('return a.dueDate < b.dueDate ? -1 : 1;', 'return a.dueDate < b.dueDate ? 1 : -1;');

test('your tests pass with the correct sortTasks', async () => {
  await expectSuitePasses();
});

test('one of your tests fails when sortTasks puts the latest date first', async () => {
  await expectSuiteCatches({ 'tasks.js': latestFirst });
});

test('one of your tests fails when sortTasks changes the array it receives', async () => {
  await expectSuiteCatches({ 'tasks.js': sortsInPlace });
});

test('one of your tests fails when sortTasks accepts an unknown key', async () => {
  await expectSuiteCatches({ 'tasks.js': neverThrows });
});

const RUNNER_WORDS = [L.rExpected, L.rDidNotThrow, L.rOtherError, L.rNeedsFunction];
test('every failure message starts with your own description', async () => {
  await expectSuitePasses();
  for (const broken of [latestFirst, sortsInPlace, neverThrows]) {
    for (const result of await runSuite({ 'tasks.js': broken })) {
      if (result.passed) continue;
      const bare = RUNNER_WORDS.some((word) => result.message.startsWith(word));
      expect(bare, `failure message of "${result.name}": ${result.message}`).toBe(false);
    }
  }
});
