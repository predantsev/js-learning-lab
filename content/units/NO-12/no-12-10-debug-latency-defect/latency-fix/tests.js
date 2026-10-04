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

test('p95 on 20,000 records is under 20 ms', async () => {
  guard();
  const answers = [];
  const server = createService(makeExpenses(20_000), { log: () => {} });
  const base = await listen(server);
  for (let i = 0; i < 23; i++) {
    const started = performance.now();
    await request(`${base}/expenses?category=home&limit=20`);
    if (i >= 3) answers.push(performance.now() - started);
  }
  const sorted = answers.toSorted((a, b) => a - b);
  expect(sorted[Math.ceil(0.95 * sorted.length) - 1], 'p95 in ms of 20 requests').toBeLessThan(20);
}, { timeoutMs: 8000 });

test('your perf check fails on the original service', async () => {
  guard();
  let failed = false;
  try {
    await checkLatency(original);
  } catch {
    failed = true;
  }
  expect(failed, 'checkLatency(original) threw').toBe(true);
}, { timeoutMs: 8000 });

test('your perf check passes on your fixed service', async () => {
  guard();
  let result;
  try {
    result = await checkLatency(createService);
  } catch (error) {
    result = `threw: ${error.message}`;
  }
  expect(typeof result, `what checkLatency(createService) returned (${result})`).toBe('number');
  expect(result, 'the p95 it returned').toBeLessThan(20);
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
