import { isValidTimetable, loadTimetable } from './timetable.js';

// Like React Native 0.86: its AbortSignal has neither timeout() nor any().
AbortSignal.timeout = undefined;
AbortSignal.any = undefined;

const URL_ = 'http://10.0.2.2:7310/timetable';
const good = [
  { id: 'd-01', route: '7', destination: L.station, departs: '08:05' },
  { id: 'd-02', route: '3', destination: L.university, departs: '08:31' },
];
const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

// plan: per call — a status number, 'offline', 'silent', or { status, body } for a custom body.
function fakeFetch(plan) {
  const calls = [];
  const fn = (url, { signal } = {}) => {
    const step = plan[Math.min(calls.length, plan.length - 1)];
    calls.push(signal);
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(abortError());
      signal?.addEventListener('abort', () => reject(abortError()));
      if (step === 'silent') return;
      if (step === 'offline') return setTimeout(() => reject(new TypeError('Network request failed')), 5);
      const { status, body } = typeof step === 'number' ? { status: step, body: step < 300 ? good : { error: 'x' } } : step;
      setTimeout(() => resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })), 5);
    });
  };
  return { fn, calls };
}
function within(promise, ms) {
  return Promise.race([promise, sleep(ms).then(() => ({ status: `still waiting after ${ms} ms` }))]);
}
const fast = { timeoutMs: 80, maxAttempts: 3, baseDelayMs: 10 };
async function run(plan, options = {}) {
  const fake = fakeFetch(plan);
  let outcome;
  try {
    outcome = await within(loadTimetable(URL_, { ...fast, ...options, fetchFn: fake.fn }), 1500);
  } catch (error) {
    outcome = { rejected: error?.name };
  }
  return { outcome, calls: fake.calls.length, signals: fake.calls };
}

test('the validator accepts departures and rejects anything else', () => {
  expect(isValidTimetable(good), 'a list of valid departures').toBe(true);
  expect(isValidTimetable([]), 'an empty list').toBe(true);
  expect(isValidTimetable({ records: 'not-a-list' }), 'the mock service body with ?invalid=1').toBe(false);
  expect(isValidTimetable([{ id: 'd-01', route: '7', destination: L.station }]), 'a departure without departs').toBe(false);
  expect(isValidTimetable([{ id: 'd-01', route: '7', destination: L.station, departs: '8 am' }]), "departs: '8 am'").toBe(false);
  expect(isValidTimetable([{ id: 'd-01', route: 7, destination: L.station, departs: '08:05' }]), 'route as a number').toBe(false);
});

test('a valid answer gives fresh departures', async () => {
  const { outcome, calls } = await run([200]);
  expect(outcome.status, 'status').toBe('fresh');
  expect(outcome.departures?.map((d) => d.id), 'ids of the departures').toEqual(['d-01', 'd-02']);
  expect(calls, 'attempts').toBe(1);
});

test('5xx and network errors are retried within the budget', async () => {
  const recovered = await run([503, 503, 200]);
  expect(recovered.outcome.status, 'status after 503, 503, 200').toBe('fresh');
  expect(recovered.calls, 'attempts for 503, 503, 200').toBe(3);
  const server = await run([500]);
  expect([server.outcome.status, server.calls], 'status and attempts when every answer is 500').toEqual(['server', 3]);
  const offline = await run(['offline']);
  expect([offline.outcome.status, offline.calls], 'status and attempts when the network fails every time').toEqual(['offline', 3]);
});

test('a silent service ends in timeout after the budget', async () => {
  const { outcome, calls, signals } = await run(['silent']);
  expect([outcome.status, calls], 'status and attempts for a silent service (timeoutMs: 80)').toEqual(['timeout', 3]);
  expect(signals.every((signal) => signal?.aborted), 'every attempt was aborted').toBe(true);
});

test('a 4xx is not retried', async () => {
  const { outcome, calls } = await run([404, 200]);
  expect([outcome.status, outcome.httpStatus, calls], 'status, httpStatus and attempts for a 404').toEqual(['rejected', 404, 1]);
});

test('an invalid body is not retried and never reaches the screen', async () => {
  const { outcome, calls } = await run([{ status: 200, body: { records: 'not-a-list' } }, 200]);
  expect([outcome.status, calls], 'status and attempts for an invalid body').toEqual(['invalid', 1]);
  expect(outcome.departures, 'departures in an invalid outcome').toBeUndefined();
  const notJson = await run([{ status: 200, body: '<html>oops</html>' }]);
  expect(notJson.outcome.status, 'status for a body that is not JSON').toBe('invalid');
});

test('an outer abort rejects with AbortError and stops', async () => {
  for (const maxAttempts of [3, 1]) {
    const fake = fakeFetch(['silent']);
    const controller = new AbortController();
    const pending = loadTimetable(URL_, { ...fast, timeoutMs: 1000, maxAttempts, fetchFn: fake.fn, signal: controller.signal });
    await sleep(30);
    controller.abort();
    let name = 'no rejection';
    try {
      const outcome = await within(pending, 500);
      name = `resolved with ${outcome?.status}`;
    } catch (error) {
      name = error?.name;
    }
    expect(name, `result of an abort during the first attempt (maxAttempts: ${maxAttempts})`).toBe('AbortError');
    await sleep(100);
    expect(fake.calls.length, `attempts after the abort (maxAttempts: ${maxAttempts})`).toBe(1);
  }
});
