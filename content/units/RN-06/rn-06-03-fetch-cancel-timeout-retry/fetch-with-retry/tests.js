import { fetchWithRetry } from './retry.js';

// Like React Native 0.86: its AbortSignal has neither timeout() nor any().
AbortSignal.timeout = undefined;
AbortSignal.any = undefined;

const URL_ = 'http://10.0.2.2:7310/records/planner';
const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

// A fake fetch: `plan` lists what each call does — a status, 'offline' or 'silent'. Records the calls.
function fakeFetch(plan) {
  const calls = [];
  const fn = (url, { signal } = {}) => {
    const step = plan[Math.min(calls.length, plan.length - 1)];
    calls.push({ at: performance.now(), signal });
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(abortError());
      signal?.addEventListener('abort', () => reject(abortError()));
      if (step === 'silent') return;
      if (step === 'offline') return setTimeout(() => reject(new TypeError('Network request failed')), 5);
      setTimeout(() => resolve(new Response('[]', { status: step })), 5);
    });
  };
  return { fn, calls };
}

// Fails the check quickly instead of hanging when a promise never settles.
function within(promise, ms) {
  return Promise.race([promise, sleep(ms).then(() => { throw new Error(`still waiting after ${ms} ms`); })]);
}

async function outcome(promise) {
  try {
    const response = await promise;
    return { status: response?.status };
  } catch (error) {
    return { error: error?.name };
  }
}

const fast = { timeoutMs: 80, maxAttempts: 3, baseDelayMs: 10 };

test('an ok answer is returned at once', async () => {
  const { fn, calls } = fakeFetch([200]);
  const result = await within(outcome(fetchWithRetry(URL_, { ...fast, fetchFn: fn })), 1000);
  expect(result, 'what fetchWithRetry returned').toEqual({ status: 200 });
  expect(calls.length, 'number of attempts').toBe(1);
});

test('a 503 is retried, and the 200 of the third attempt is returned', async () => {
  const { fn, calls } = fakeFetch([503, 503, 200]);
  const result = await within(outcome(fetchWithRetry(URL_, { ...fast, fetchFn: fn })), 1500);
  expect(result, 'what fetchWithRetry returned').toEqual({ status: 200 });
  expect(calls.length, 'number of attempts').toBe(3);
});

test('a 404 is returned at once without a retry', async () => {
  const { fn, calls } = fakeFetch([404, 200]);
  const result = await within(outcome(fetchWithRetry(URL_, { ...fast, fetchFn: fn })), 1000);
  expect(result, 'what fetchWithRetry returned').toEqual({ status: 404 });
  expect(calls.length, 'number of attempts').toBe(1);
});

test('after maxAttempts failures it stops with the last result', async () => {
  const always503 = fakeFetch([503]);
  const five = await within(outcome(fetchWithRetry(URL_, { ...fast, fetchFn: always503.fn })), 1500);
  expect(five, 'result when every answer is 503').toEqual({ status: 503 });
  expect(always503.calls.length, 'attempts when every answer is 503').toBe(3);
  const offline = fakeFetch(['offline']);
  const net = await within(outcome(fetchWithRetry(URL_, { ...fast, fetchFn: offline.fn })), 1500);
  expect(net, 'result when every attempt has a network error').toEqual({ error: 'TypeError' });
  expect(offline.calls.length, 'attempts with network errors').toBe(3);
});

test('an attempt without an answer is aborted after timeoutMs', async () => {
  const { fn, calls } = fakeFetch(['silent']);
  const started = performance.now();
  const result = await within(outcome(fetchWithRetry(URL_, { ...fast, maxAttempts: 1, fetchFn: fn })), 1000);
  expect(result, 'result for a silent server and maxAttempts: 1').toEqual({ error: 'TimeoutError' });
  expect(calls[0].signal?.aborted, 'the signal passed to fetchFn is aborted').toBe(true);
  expect(performance.now() - started, 'ms until it gave up (timeoutMs: 80)').toBeLessThan(600);
});

test('an outer abort stops at once and starts no new attempt', async () => {
  const { fn, calls } = fakeFetch([503, 200]);
  const controller = new AbortController();
  const pending = outcome(fetchWithRetry(URL_, { ...fast, baseDelayMs: 300, fetchFn: fn, signal: controller.signal }));
  await sleep(60); // the first 503 came back; the policy is waiting before the next attempt
  controller.abort();
  const result = await within(pending, 200);
  expect(result, 'result after the abort').toEqual({ error: 'AbortError' });
  await sleep(400);
  expect(calls.length, 'attempts, also 400 ms after the abort').toBe(1);
});

test('the wait before each next attempt grows', async () => {
  const { fn, calls } = fakeFetch([503, 503, 200]);
  await within(fetchWithRetry(URL_, { ...fast, baseDelayMs: 60, fetchFn: fn }), 1500);
  expect(calls.length, 'number of attempts').toBe(3);
  const first = calls[1].at - calls[0].at;
  const second = calls[2].at - calls[1].at;
  expect(second, `second wait (ms) compared with the first one (${Math.round(first)} ms)`).toBeGreaterThan(first + 30);
});
