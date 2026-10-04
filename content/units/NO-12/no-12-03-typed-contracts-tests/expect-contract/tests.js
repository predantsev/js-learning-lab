import { AssertionError } from 'node:assert';
import http from 'node:http';
import { habitSummarySchema } from './contract.js';
import { expectContract } from './expect-contract.js';

const habit = { id: 'h-02', name: L.reading, active: true, completionCount: 3 };
const routes = {
  '/list': [200, JSON.stringify([habit, { ...habit, id: 'h-03', completionCount: 0 }])],
  '/one': [200, JSON.stringify(habit)],
  '/as-text': [200, JSON.stringify([habit, { ...habit, id: 'h-03', completionCount: '7' }])],
  '/two-errors': [200, JSON.stringify([{ ...habit, id: 2, active: 'yes' }])],
  '/missing': [404, JSON.stringify({ error: 'not found' })],
  '/created': [201, JSON.stringify(habit)],
  '/not-json': [200, '<h1>oops</h1>'],
  '/extra': [200, JSON.stringify([{ ...habit, streak: 2 }])],
};
const server = http.createServer((request, response) => {
  const [status, body] = routes[request.url] ?? [500, '{}'];
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(body);
});
const base = await listen(server);
const get = (path) => fetch(base + path, { signal: AbortSignal.timeout(2000) });
const guard = () => expect(typeof expectContract, 'type of expectContract').toBe('function');

// Runs the helper and returns what it threw (null when it did not throw).
async function errorOf(path, expectedStatus) {
  try {
    await expectContract(await get(path), habitSummarySchema, expectedStatus);
    return null;
  } catch (error) {
    return error;
  }
}

test('returns the parsed body when status and contract match', async () => {
  guard();
  expect(await expectContract(await get('/list'), habitSummarySchema), 'what expectContract returns for a list').toEqual([habit, { ...habit, id: 'h-03', completionCount: 0 }]);
  expect(await expectContract(await get('/one'), habitSummarySchema), 'what expectContract returns for one habit').toEqual(habit);
});

test('a number sent as text fails with its path and value', async () => {
  guard();
  const error = await errorOf('/as-text');
  expect(error instanceof AssertionError, `an AssertionError is thrown (got ${error?.name ?? 'nothing'})`).toBe(true);
  expect(error.message, 'the message').toContain('[1].completionCount');
  expect(error.message, 'the message').toContain('"7"');
});

test('every contract error is reported, not only the first', async () => {
  guard();
  const error = await errorOf('/two-errors');
  expect(error instanceof AssertionError, `an AssertionError is thrown (got ${error?.name ?? 'nothing'})`).toBe(true);
  expect(error.message, 'the message').toContain('[0].id');
  expect(error.message, 'the message').toContain('[0].active');
});

test('a wrong status fails and names both statuses', async () => {
  guard();
  const error = await errorOf('/missing');
  expect(error instanceof AssertionError, `an AssertionError is thrown (got ${error?.name ?? 'nothing'})`).toBe(true);
  expect(error.message, 'the message').toContain('404');
  expect(error.message, 'the message').toContain('200');
});

test('the expected status can be passed', async () => {
  guard();
  expect(await expectContract(await get('/created'), habitSummarySchema, 201), 'what expectContract returns for a 201').toEqual(habit);
});

test('a body that is not JSON fails as an AssertionError', async () => {
  guard();
  const error = await errorOf('/not-json');
  expect(error === null, 'expectContract throws for a body that is not JSON').toBe(false);
  expect(error instanceof AssertionError, `an AssertionError is thrown (got ${error.name})`).toBe(true);
});

test('extra fields do not break the contract', async () => {
  guard();
  const error = await errorOf('/extra');
  expect(error?.message ?? null, 'what expectContract threw for a habit with an extra field').toBe(null);
});
