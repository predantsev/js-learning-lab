import { createService as original } from './original-service.js';
import { createService } from './service.js';
import { checkLatency } from './perf-check.js';
import { makeExpenses } from './expenses.js';

const guard = () => {
  expect(typeof createService, 'type of createService').toBe('function');
  expect(typeof checkLatency, 'type of checkLatency').toBe('function');
};
const logged = [];

async function run(expenses, paths) {
  const server = createService(expenses, { log: (line) => logged.push(line) });
  const base = await listen(server);
  const answers = [];
  for (const path of paths) answers.push(await request(base + path));
  return answers;
}

test('the ranks are still right', async () => {
  guard();
  const expenses = makeExpenses(12);
  const [answer] = await run(expenses, ['/expenses?category=food&limit=3']);
  const byAmount = expenses.toSorted((a, b) => b.amountMinor - a.amountMinor);
  const expected = byAmount.filter((e) => e.category === 'food').slice(0, 3).map((e) => [e.id, byAmount.indexOf(e) + 1]);
  expect(answer.json.map((e) => [e.id, e.rank]), '[id, rank] of GET ?category=food&limit=3').toEqual(expected);
});

// Counts how many times one request sorts the whole list (toSorted or sort on an array of all the
// expenses). Work is counted instead of timed, so the check does not depend on the computer's speed.
test('one request sorts all the expenses at most once', async () => {
  guard();
  const records = 2_000;
  const server = createService(makeExpenses(records), { log: () => {} });
  const base = await listen(server);
  await request(`${base}/expenses?category=home&limit=20`); // a warm-up request, not counted
  const { toSorted, sort } = Array.prototype;
  let fullSorts = 0;
  Array.prototype.toSorted = function (...args) { if (this.length >= records) fullSorts++; return toSorted.apply(this, args); };
  Array.prototype.sort = function (...args) { if (this.length >= records) fullSorts++; return sort.apply(this, args); };
  try {
    await request(`${base}/expenses?category=home&limit=20`);
  } finally {
    Array.prototype.toSorted = toSorted;
    Array.prototype.sort = sort;
  }
  expect(fullSorts, `sorts of all ${records} expenses during one request with limit=20`).toBeLessThanOrEqual(1);
});

// The perf-check checks pass a budget that lies between the p95 of the original service and the
// p95 of your service, both measured here on this computer: a slow or a fast machine moves both.
let calibration;
async function p95Of(create) {
  const server = create(makeExpenses(20_000), { log: () => {} });
  const base = await listen(server);
  const durations = [];
  for (let i = 0; i < 13; i++) {
    const started = performance.now();
    await request(`${base}/expenses?category=home&limit=20`);
    if (i >= 3) durations.push(performance.now() - started);
  }
  const sorted = durations.toSorted((a, b) => a - b);
  return sorted[Math.ceil(0.95 * sorted.length) - 1];
}
async function budget() {
  calibration ??= (async () => {
    const slow = await p95Of(original);
    const fast = await p95Of(createService);
    // Between the two speeds; when your service is not clearly faster yet, half of the original's p95.
    const between = fast < slow / 2 ? Math.sqrt(slow * fast) : slow / 2;
    return { slow, fast, budgetMs: Math.round(between * 10) / 10 };
  })();
  return calibration;
}

test('your perf check fails on the original service', async () => {
  guard();
  const { slow, fast, budgetMs } = await budget();
  let failed = false;
  try {
    await checkLatency(original, { budgetMs });
  } catch {
    failed = true;
  }
  expect(failed, `checkLatency(original, { budgetMs: ${budgetMs} }) threw (measured here: original ${slow.toFixed(1)} ms, yours ${fast.toFixed(1)} ms)`).toBe(true);
}, { timeoutMs: 8000 });

test('your perf check passes on your fixed service', async () => {
  guard();
  const { slow, fast, budgetMs } = await budget();
  let result;
  try {
    result = await checkLatency(createService, { budgetMs });
  } catch (error) {
    result = `threw: ${error.message}`;
  }
  expect(typeof result, `what checkLatency(createService, { budgetMs: ${budgetMs} }) returned (${result}; measured here: original ${slow.toFixed(1)} ms, yours ${fast.toFixed(1)} ms)`).toBe('number');
  expect(result, 'the p95 it returned').toBeLessThan(budgetMs);
}, { timeoutMs: 8000 });

test('the log line leaks no payer address', async () => {
  guard();
  logged.length = 0;
  await run(makeExpenses(6), ['/expenses?category=food&payer=payer-3%40example.invalid']);
  expect(logged.length, 'number of log lines').toBeGreaterThan(0);
  const text = JSON.stringify(logged);
  expect(/@|%40|payer-3/.test(text), `the log lines contain an address: ${text}`).toBe(false);
});

test('the log line keeps requestId, route, status and ms', async () => {
  guard();
  logged.length = 0;
  await run(makeExpenses(6), ['/expenses?category=fun']);
  expect(logged[0], 'the log line').toMatchObject({ route: '/expenses', status: 200 });
  expect(typeof logged[0]?.requestId, 'type of requestId').toBe('string');
  expect(typeof logged[0]?.ms, 'type of ms').toBe('number');
});
