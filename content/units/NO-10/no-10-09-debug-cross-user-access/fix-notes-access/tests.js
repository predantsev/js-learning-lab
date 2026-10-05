// Replays the four seeded requests over real HTTP, then checks that the owner's access still works.
import { createApp } from './app.js';

async function start() {
  const clock = { ms: 0, now() { return this.ms; } };
  const base = await listen(createApp({ clock }));
  const call = (method, path, headers = {}, body) =>
    request(`${base}${path}`, { method, headers, body, signal: AbortSignal.timeout(2000) });
  const login = async (user, password) => {
    const response = await call('POST', '/login', {}, { user, password });
    return [response.headers['set-cookie'] ?? []].flat()[0]?.split(';')[0] ?? '';
  };
  return { clock, call, login };
}

test("A: u-02 reading u-01's note answers 404", async () => {
  const { call, login } = await start();
  const cookie = await login('u-02', 'river-stone-7');
  const response = await call('GET', '/notes/n-1', { cookie });
  expect(response.status, 'status of u-02 GET /notes/n-1').toBe(404);
  expect(response.json?.title, 'the note title must not be in the answer').toBeUndefined();
});

test('B: a session past its 2-hour expiry answers 401', async () => {
  const { clock, call, login } = await start();
  const cookie = await login('u-01', 'sunflower-42');
  clock.ms = 120 * 60_000 + 1;
  expect((await call('GET', '/notes/n-1', { cookie })).status, 'status 2 h + 1 ms after login').toBe(401);
});

test('C: a session that logged out answers 401', async () => {
  const { call, login } = await start();
  const cookie = await login('u-01', 'sunflower-42');
  expect((await call('POST', '/logout', { cookie })).status, 'status of POST /logout').toBe(204);
  expect((await call('GET', '/notes/n-1', { cookie })).status, 'status with the logged-out cookie').toBe(401);
});

test('D: GET /notes with the allowed Origin but no session answers 401', async () => {
  const { call } = await start();
  const response = await call('GET', '/notes', { origin: 'http://127.0.0.1:4310' });
  expect(response.status, 'status of GET /notes with Origin and no cookie').toBe(401);
});

test('the owner still reads their note, and the list shows only their own notes', async () => {
  const { clock, call, login } = await start();
  const cookie = await login('u-01', 'sunflower-42');
  clock.ms = 120 * 60_000; // exactly at the limit: still valid
  expect((await call('GET', '/notes/n-1', { cookie })).json?.title, 'title of n-1 for its owner').toBe(L.gifts);
  const list = await call('GET', '/notes', { cookie, origin: 'http://127.0.0.1:4310' });
  expect(list.status, 'status of the owner GET /notes').toBe(200);
  expect((list.json ?? []).map((note) => note.id), 'ids in the owner list').toEqual(['n-1', 'n-3']);
});
