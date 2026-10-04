import { withDeadline } from './deadline.js';
import { createApp } from './server.js';
import { createRepository } from './repository.js';

const never = () => new Promise(() => {}); // work that ignores its signal and never settles
const quiet = () => new AbortController().signal; // a caller that never aborts

// Settles within `ms`, or reports that it is still pending.
async function within(ms, promise) {
  return Promise.race([
    promise.then((value) => ({ value }), (error) => ({ error })),
    sleep(ms).then(() => ({ pending: true })),
  ]);
}

test('returns the result of work that finishes in time', async () => {
  const outcome = await within(800, withDeadline(300, quiet(), async () => 'report-ok'));
  expect(outcome.pending ? 'still pending after 800 ms' : outcome.error ? `rejected: ${outcome.error.name}` : outcome.value, 'result of withDeadline(300, …, fast work)').toBe('report-ok');
});

test('rejects with a TimeoutError at the deadline', async () => {
  const outcome = await within(800, withDeadline(100, quiet(), never));
  expect(outcome.pending ? 'still pending after 800 ms' : outcome.error ? outcome.error.name : 'resolved', 'how withDeadline(100, …, endless work) settles').toBe('TimeoutError');
});

test("aborts the work's signal at the deadline", async () => {
  let workSignal = null;
  await within(800, withDeadline(100, quiet(), (s) => { workSignal = s; return never(); }));
  expect(workSignal?.aborted ?? 'work was never called', "the work's signal after the deadline").toBe(true);
});

test("aborts the work's signal when the caller's signal aborts", async () => {
  const caller = new AbortController();
  let workSignal = null;
  const pending = withDeadline(2000, caller.signal, (s) => { workSignal = s; return never(); });
  pending.catch(() => {}); // it may reject; this check looks at the signal
  setTimeout(() => caller.abort(), 50);
  await within(500, pending);
  expect(workSignal?.aborted ?? 'work was never called', "the work's signal 500 ms after the caller aborted").toBe(true);
});

test('leaves no timer behind when the work finishes early', async () => {
  const before = activeResources().filter((name) => name === 'Timeout').length;
  await withDeadline(5000, quiet(), async () => 'report-ok');
  await sleep(10);
  const after = activeResources().filter((name) => name === 'Timeout').length;
  expect(after - before, 'timers still waiting after the work finished').toBe(0);
});

test('the server answers 503 at its deadline', async () => {
  const app = createApp({ deadlineMs: 150, repository: createRepository({ delayMs: 1000 }) });
  const response = await request(`${await listen(app)}/total`, { signal: AbortSignal.timeout(900) });
  expect(response.status, 'status of GET /total with a 150 ms deadline and a 1 s repository').toBe(503);
});

test('the server stops the repository work when the client leaves', async () => {
  const repository = createRepository({ delayMs: 1000 });
  const app = createApp({ deadlineMs: 2000, repository });
  const base = await listen(app);
  await request(`${base}/total`, { signal: AbortSignal.timeout(100) }).catch(() => {});
  await waitFor(() => repository.lastSignal?.aborted, { timeout: 600 });
});
