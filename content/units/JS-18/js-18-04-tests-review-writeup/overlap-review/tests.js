const loadReview = async () => import('./review.js');
const rulesOnMain = () => import('./bookings.before.js');
const rulesInPullRequest = () => import('./bookings.js');

// Runs the learner's bookingTests once against the given rules module.
async function suite(rules) {
  const { bookingTests } = await import('./bookings.test.js');
  expect(typeof bookingTests, 'type of the bookingTests export of bookings.test.js').toBe('function');
  const runner = await import('./testing.js');
  runner.reset();
  bookingTests(rules);
  return runner.run({ print: false });
}
const kind = (result) => result.name.trim().toLowerCase().split(':')[0];
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
const DATE = /\b\d{4}-\d{2}-\d{2}\b/g;

test('your tests pass on main', async () => {
  const results = await suite(await rulesOnMain());
  expect(results.length, 'number of tests in bookingTests').toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail on main').toEqual([]);
});

test('a unit test fails on the pull request', async () => {
  const results = await suite(await rulesInPullRequest());
  expect(results.some((result) => kind(result) === 'unit' && !result.passed), 'a "unit: …" test that fails on the pull request').toBe(true);
});

test('an integration test fails on the pull request', async () => {
  const results = await suite(await rulesInPullRequest());
  expect(results.some((result) => kind(result) === 'integration' && !result.passed), 'an "integration: …" test that fails on the pull request').toBe(true);
});

// Runs bookingTests once more with fresh copies of testing.js and service.js that record, per test,
// whether service.book was called and with which rules object.
const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
const rewrite = (source, urls) => source.replace(/(["'])\.\/([\w./-]+)\1/g, (match, quote, path) => JSON.stringify(urls[path] ?? `~/${path}`));
async function recordedSuite(rules) {
  const source = files['bookings.test.js'];
  if (typeof source !== 'string') throw new Error('bookings.test.js is missing');
  const realTesting = moduleUrl(files['testing.js']);
  const realService = moduleUrl(files['service.js']);
  const urls = {
    'testing.js': moduleUrl(`import * as real from ${JSON.stringify(realTesting)};
export const { expect, reset, run } = real;
export function test(name, fn) {
  real.test(name, async () => {
    globalThis.__jsllCurrentTest = name;
    try { return await fn(); } finally { globalThis.__jsllCurrentTest = null; }
  });
}`),
    'service.js': moduleUrl(`import * as real from ${JSON.stringify(realService)};
export const { memoryStore } = real;
export function createBookingService(store, rules) {
  const service = real.createBookingService(store, rules);
  return { book(request) { globalThis.__jsllBooked.push({ test: globalThis.__jsllCurrentTest, rules }); return service.book(request); } };
}`),
  };
  const booked = [];
  globalThis.__jsllBooked = booked;
  try {
    const { bookingTests } = await import(moduleUrl(rewrite(source, urls)));
    expect(typeof bookingTests, 'type of the bookingTests export of bookings.test.js').toBe('function');
    const runner = await import(realTesting);
    bookingTests(rules);
    const results = await runner.run({ print: false });
    return results.map((result) => ({ ...result, standIn: booked.some((call) => call.test === result.name && call.rules !== rules && typeof call.rules?.canBook === 'function') }));
  } finally {
    delete globalThis.__jsllBooked;
    delete globalThis.__jsllCurrentTest;
  }
}

test('a mocked test passes on both versions', async () => {
  const onMain = await recordedSuite(await rulesOnMain());
  const inPullRequest = await recordedSuite(await rulesInPullRequest());
  const mocked = onMain.filter((result) => kind(result) === 'mocked');
  expect(mocked.length, '"mocked: …" tests').toBeGreaterThan(0);
  const withStandIn = mocked.filter((result) => result.standIn);
  expect(withStandIn.length, '"mocked: …" tests that call service.book with your own object instead of rules').toBeGreaterThan(0);
  const passingEverywhere = withStandIn
    .filter((result) => result.passed)
    .filter((result) => inPullRequest.some((other) => other.name === result.name && other.passed));
  expect(passingEverywhere.length, '"mocked: …" tests with a stand-in that pass on main and on the pull request').toBeGreaterThan(0);
});

test('failingCase is accepted by the pull request and refused on main', async () => {
  const { failingCase } = await loadReview();
  const { existing, request } = failingCase ?? {};
  expect(typeof existing?.start === 'string' && typeof request?.start === 'string', 'failingCase has an existing booking and a request').toBe(true);
  expect((await rulesOnMain()).canBook([existing], request), 'canBook on main').toBe(false);
  expect((await rulesInPullRequest()).canBook([existing], request), 'canBook in the pull request').toBe(true);
});

test('the defect comment names the dates of the failing case', async () => {
  const { defectComment, failingCase } = await loadReview();
  const dates = [failingCase?.existing?.start, failingCase?.existing?.end, failingCase?.request?.start, failingCase?.request?.end].filter(Boolean);
  const named = dates.filter((date) => String(defectComment ?? '').includes(date));
  expect(new Set(named).size, 'dates of failingCase named in defectComment').toBeGreaterThanOrEqual(2);
});

test('the mock explanation says what the stand-in replaced', async () => {
  const { mockExplanation } = await loadReview();
  const text = String(mockExplanation ?? '');
  expect(text.includes('canBook'), 'mockExplanation names canBook').toBe(true);
  expect(text.trim().length, 'length of mockExplanation').toBeGreaterThanOrEqual(60);
});

test('the decision is request-changes', async () => {
  const { decision } = await loadReview();
  // A boolean comparison: a failure message must not print the expected decision.
  expect(decision === 'request-changes', `decision (${JSON.stringify(decision ?? null)}) follows the evidence`).toBe(true);
});

test('the write-up records the decision with its evidence', async () => {
  const { writeUp } = await loadReview();
  const text = String(writeUp ?? '');
  expect(text.trim().length, 'length of writeUp').toBeGreaterThanOrEqual(200);
  expect(text.includes('overlaps'), 'writeUp names overlaps').toBe(true);
  expect((text.match(DATE) ?? []).length, 'dates in writeUp').toBeGreaterThanOrEqual(1);
});
