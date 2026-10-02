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

test('a mocked test passes on both versions', async () => {
  const onMain = await suite(await rulesOnMain());
  const inPullRequest = await suite(await rulesInPullRequest());
  const passingEverywhere = onMain
    .filter((result) => kind(result) === 'mocked' && result.passed)
    .filter((result) => inPullRequest.some((other) => other.name === result.name && other.passed));
  expect(passingEverywhere.length, '"mocked: …" tests that pass on main and on the pull request').toBeGreaterThan(0);
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
  expect(decision, 'decision').toBe('request-changes');
});

test('the write-up records the decision with its evidence', async () => {
  const { writeUp } = await loadReview();
  const text = String(writeUp ?? '');
  expect(text.trim().length, 'length of writeUp').toBeGreaterThanOrEqual(200);
  expect(text.includes('overlaps'), 'writeUp names overlaps').toBe(true);
  expect((text.match(DATE) ?? []).length, 'dates in writeUp').toBeGreaterThanOrEqual(1);
});
