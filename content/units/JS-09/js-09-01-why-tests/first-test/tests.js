// Runs the learner's own test file once more, with chosen modules replaced by other versions.
// The rewritten copy imports a fresh copy of testing.js, so its tests never mix with the normal run.
const SUITE_FILE = 'label.test.js';
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

// Wrong versions of formatLabel. Each one changes the text for every possible wish.
const withoutPrice = `export function formatLabel(item) {
  return item.name;
}`;
const withoutSpace = `export function formatLabel(item) {
  const price = item.price === null ? ${JSON.stringify(L.noPrice)} : item.price;
  return item.name + ":" + price;
}`;

test('your tests pass with the correct formatLabel', async () => {
  await expectSuitePasses();
});

test('one of your tests fails when the price is missing from the text', async () => {
  await expectSuiteCatches({ 'label.js': withoutPrice });
});

test('one of your tests fails when the space after the colon is missing', async () => {
  await expectSuiteCatches({ 'label.js': withoutSpace });
});
