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

// The four habits of FIXTURE_JSON, as the checks expect makeFixtures() to return them.
const EXPECTED = [
  { id: "h-01", name: L.h01, frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
  { id: "h-02", name: L.h02, frequency: "daily", active: true, completions: ["2026-02-26", "2026-02-28", "2026-03-01"] },
  { id: "h-03", name: L.h03, frequency: "daily", active: true, completions: ["2026-03-01"] },
  { id: "h-05", name: L.h05, frequency: "daily", active: false, completions: ["2026-02-20"] },
];

async function loadMakeFixtures() {
  const fixtures = await import('./fixtures.js');
  expect(typeof fixtures.makeFixtures, 'type of the makeFixtures export of fixtures.js').toBe('function');
  return fixtures.makeFixtures;
}

test('makeFixtures returns the four habits of FIXTURE_JSON', async () => {
  const makeFixtures = await loadMakeFixtures();
  expect(makeFixtures(), 'makeFixtures()').toEqual(EXPECTED);
});

test('every call of makeFixtures returns new arrays and new objects', async () => {
  const makeFixtures = await loadMakeFixtures();
  const first = makeFixtures();
  const second = makeFixtures();
  expect(first === second, 'the two calls return the same array').toBe(false);
  expect(first[0] === second[0], 'the two calls share the habit object h-01').toBe(false);
  expect(first[0].completions === second[0].completions, 'the two calls share the completions array of h-01').toBe(false);
  first[0].active = false;
  first[0].completions.push('2026-03-02');
  expect(makeFixtures(), 'a fresh call after changing an earlier result').toEqual(EXPECTED);
});

// Every run gets its own copy of fixtures.js, exactly as a fresh start of the program would.
test('your tests pass in the order they are written', async () => {
  await expectSuitePasses({ 'fixtures.js': files['fixtures.js'] });
});

test('your tests pass in reverse order too', async () => {
  const results = await runSuite({ 'fixtures.js': files['fixtures.js'] }, { reverse: true });
  expect(results.length, 'number of tests in habits.test.js').toBeGreaterThan(1);
  expect(failing(results), 'your tests that fail when run in reverse order').toEqual([]);
});

test('one of your tests fails when countActive counts paused habits too', async () => {
  const countsEverything = 'export function countActive(habits) { return habits.length; }';
  const results = await runSuite({ 'fixtures.js': files['fixtures.js'], 'habits.js': countsEverything });
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken countActive').toBe(true);
});
