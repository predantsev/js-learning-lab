// Real HTTP requests to the tasks service; each check gets a fresh repository it can inspect.
import { createApp } from './app.js';
import { createRepo } from './repo.js';

async function start() {
  const repo = createRepo();
  const base = await listen(createApp({ repo }));
  // token: a lab token sent as "Bearer <token>", or a whole Authorization value in { raw }.
  const send = (method, path, token) => request(`${base}${path}`, {
    method,
    headers: token ? { authorization: token.raw ?? `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(2000),
  });
  return { repo, send };
}

test('a request without a credential answers 401 and never reaches the repository', async () => {
  const { repo, send } = await start();
  const response = await send('GET', '/tasks/t-1');
  expect(response.status, 'status of GET /tasks/t-1 without a credential').toBe(401);
  expect(repo.calls, 'repository calls made for that request').toEqual([]);
});

test('a malformed or unknown credential answers 401, not 403', async () => {
  const { send } = await start();
  expect((await send('GET', '/tasks/t-1', 'lab-token-xyz')).status, 'status with an unknown token').toBe(401);
  const malformed = await send('GET', '/tasks/t-1', { raw: 'Basic lab-token-u01' });
  expect(malformed.status, 'status with "Authorization: Basic …"').toBe(401);
});

test("u-02 reading u-01's task answers 403", async () => {
  const { send } = await start();
  const response = await send('GET', '/tasks/t-1', 'lab-token-u02');
  expect(response.status, 'status of u-02 reading t-1').toBe(403);
  expect(response.json?.title, 'the task title must not be in the answer').toBeUndefined();
});

test('the owner reads their own task with 200', async () => {
  const { send } = await start();
  const response = await send('GET', '/tasks/t-1', 'lab-token-u01');
  expect(response.status, 'status of u-01 reading t-1').toBe(200);
  expect(response.json?.title, 'title of t-1').toBe(L.tickets);
});

test("u-02 deleting u-01's task answers 403 and the task stays", async () => {
  const { repo, send } = await start();
  const response = await send('DELETE', '/tasks/t-1', 'lab-token-u02');
  expect(response.status, 'status of u-02 deleting t-1').toBe(403);
  expect(repo.calls.filter((call) => call.startsWith('deleteTask')), 'deleteTask calls').toEqual([]);
});

test('the owner deletes their own task with 204', async () => {
  const { send } = await start();
  expect((await send('DELETE', '/tasks/t-2', 'lab-token-u02')).status, 'status of u-02 deleting t-2').toBe(204);
  expect((await send('GET', '/tasks/t-2', 'lab-token-u02')).status, 'status of reading t-2 after it was deleted').toBe(404);
});

test('a missing task answers 404 to a signed-in user', async () => {
  const { send } = await start();
  expect((await send('GET', '/tasks/t-9', 'lab-token-u01')).status, 'status of GET /tasks/t-9').toBe(404);
});
