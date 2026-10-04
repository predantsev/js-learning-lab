// Hidden checks of the notes API: real HTTP requests to a server started on a free loopback port.
import { createApp } from './app.ts';
import { seedNotes } from './notes.ts';
import { createNotesRepo } from './repo.ts';

const start = (options) => listen(createApp(options));
const ids = (response) => (response.json?.items ?? []).map((note) => note.id);
const codeOf = (response) => response.json?.error?.code;
// A repository whose every call takes delayMs and records the signal it was given.
const recordingRepo = (delayMs) => {
  const base = createNotesRepo(seedNotes, { delayMs });
  const signals = [];
  const repo = {};
  for (const name of ['list', 'get', 'create', 'replace', 'remove']) {
    repo[name] = (...args) => {
      signals.push(args[args.length - 1]);
      return base[name](...args);
    };
  }
  return { repo, signals };
};

test('CRUD answers 201, 200, 200, 200, 204 and then 404', async () => {
  const base = await start();
  const created = await request(`${base}/v1/notes`, { method: 'POST', body: { title: `  ${L.newTitle} ` } });
  expect(created.status, 'status of POST /v1/notes').toBe(201);
  expect(created.json, 'the created note').toEqual({ id: 'n-13', title: L.newTitle, text: '', pinned: false });
  expect((await request(`${base}/v1/notes/n-13`)).status, 'status of GET /v1/notes/n-13').toBe(200);
  const replaced = await request(`${base}/v1/notes/n-13`, { method: 'PUT', body: { title: L.renamed } });
  expect(replaced.json, 'n-13 after PUT').toEqual({ id: 'n-13', title: L.renamed, text: '', pinned: false });
  const patched = await request(`${base}/v1/notes/n-13`, { method: 'PATCH', body: { pinned: true } });
  expect(patched.json, 'n-13 after PATCH').toEqual({ id: 'n-13', title: L.renamed, text: '', pinned: true });
  expect((await request(`${base}/v1/notes/n-13`, { method: 'DELETE' })).status, 'status of DELETE').toBe(204);
  const gone = await request(`${base}/v1/notes/n-13`);
  expect(gone.status, 'status of GET after DELETE').toBe(404);
  expect(codeOf(gone), 'code of GET after DELETE').toBe('NOT_FOUND');
});

test('an invalid body answers 400 VALIDATION_FAILED with field details and stores nothing', async () => {
  const base = await start();
  const response = await request(`${base}/v1/notes`, { method: 'POST', body: { title: '', pinned: 'yes', color: 'red' } });
  expect(response.status, 'status of the invalid POST').toBe(400);
  expect(codeOf(response), 'code of the invalid POST').toBe('VALIDATION_FAILED');
  expect(Object.keys(response.json?.error?.details ?? {}).sort(), 'fields in details').toEqual(['color', 'pinned', 'title']);
  const long = await request(`${base}/v1/notes`, { method: 'POST', body: { title: 'x'.repeat(61) } });
  expect(long.status, 'status for a 61-character title').toBe(400);
  const filter = await request(`${base}/v1/notes?pinned=maybe`);
  expect(filter.status, 'status for pinned=maybe').toBe(400);
  const patched = await request(`${base}/v1/notes/n-02`, { method: 'PATCH', body: { title: 42 } });
  expect(patched.status, 'status of PATCH { title: 42 }').toBe(400);
  expect((await request(`${base}/v1/notes/n-02`)).json?.title, 'title of n-02 after the bad PATCH').toBe(L.n02);
  expect(ids(await request(`${base}/v1/notes?limit=50`)).length, 'notes after the invalid POST').toBe(12);
});

test('malformed JSON answers 400 MALFORMED_JSON', async () => {
  const base = await start();
  const response = await request(`${base}/v1/notes`, { method: 'POST', body: '{"title": "unfinished', headers: { 'content-type': 'application/json' } });
  expect(response.status, 'status for a truncated JSON body').toBe(400);
  expect(codeOf(response), 'code for a truncated JSON body').toBe('MALFORMED_JSON');
});

test('a body over 1024 bytes answers 413 PAYLOAD_TOO_LARGE', async () => {
  const base = await start();
  const body = JSON.stringify({ title: 'x', text: 'y'.repeat(3000) });
  const response = await request(`${base}/v1/notes`, { method: 'POST', body, headers: { 'content-type': 'application/json' } });
  expect(response.status, 'status for a 3 KB body').toBe(413);
  expect(codeOf(response), 'code for a 3 KB body').toBe('PAYLOAD_TOO_LARGE');
});

test('pages by cursor: 5 + 5 + 2 notes, then nextCursor null; limit is checked', async () => {
  const base = await start();
  const seen = [];
  let path = '/v1/notes?limit=5';
  let pages = 0;
  while (path && pages < 4) {
    const page = await request(base + path);
    expect(page.status, `status of page ${pages + 1}`).toBe(200);
    seen.push(ids(page).length);
    pages += 1;
    path = page.json?.nextCursor ? `/v1/notes?limit=5&cursor=${page.json.nextCursor}` : null;
  }
  expect(seen, 'notes per page').toEqual([5, 5, 2]);
  for (const limit of ['0', '51', 'ten']) {
    const bad = await request(`${base}/v1/notes?limit=${limit}`);
    expect(bad.status, `status for limit=${limit}`).toBe(400);
  }
});

test('page boundary: a page that ends exactly at the last note has nextCursor null', async () => {
  const base = await start();
  const all = await request(`${base}/v1/notes?pinned=true&limit=4`);
  expect(ids(all), 'pinned notes, limit 4').toEqual(['n-01', 'n-04', 'n-07', 'n-10']);
  expect(all.json?.nextCursor, 'nextCursor when the page ends at the last pinned note').toBe(null);
  const first = await request(`${base}/v1/notes?pinned=true&limit=3`);
  expect(first.json?.nextCursor, 'nextCursor after 3 of 4 pinned notes').toBe('n-07');
  const last = await request(`${base}/v1/notes?pinned=true&limit=3&cursor=n-07`);
  expect(ids(last), 'the last pinned page').toEqual(['n-10']);
  expect(last.json?.nextCursor, 'nextCursor of the last pinned page').toBe(null);
});

test('a retried POST with the same Idempotency-Key creates one note; another body answers 422', async () => {
  const base = await start();
  const send = (title) => request(`${base}/v1/notes`, { method: 'POST', body: { title }, headers: { 'Idempotency-Key': 'retry-1' } });
  const first = await send(L.newTitle);
  const again = await send(L.newTitle);
  expect(again.status, 'status of the retry').toBe(201);
  expect(again.json, 'body of the retry').toEqual(first.json);
  const reused = await send(L.renamed);
  expect(reused.status, 'status of the key with another body').toBe(422);
  expect(ids(await request(`${base}/v1/notes?limit=50`)).length, 'notes after the retries').toBe(13);
});

test('a slow repository answers 503 DEADLINE_EXCEEDED and its signal is aborted', async () => {
  const { repo, signals } = recordingRepo(2000);
  const base = await start({ repo, deadlineMs: 200 });
  const response = await request(`${base}/v1/notes/n-01`, { signal: AbortSignal.timeout(1500) });
  expect(response.status, 'status when the repository is slower than the deadline').toBe(503);
  expect(codeOf(response), 'code when the deadline passed').toBe('DEADLINE_EXCEEDED');
  expect(signals.length > 0 && signals.every((signal) => signal?.aborted === true), 'every signal given to the repository is aborted').toBe(true);
});

test('a client abort aborts the repository signal', async () => {
  const { repo, signals } = recordingRepo(1500);
  const base = await start({ repo, deadlineMs: 3000 });
  const controller = new AbortController();
  const pending = request(`${base}/v1/notes`, { signal: controller.signal }).catch(() => 'aborted');
  await waitFor(() => signals.length > 0, { timeout: 1000 });
  controller.abort();
  expect(await pending, 'the request was aborted by the client').toBe('aborted');
  await waitFor(() => signals[0]?.aborted === true, { timeout: 1000 });
});

test('v1 keeps title, v2 sends heading', async () => {
  const base = await start();
  expect((await request(`${base}/v1/notes/n-01`)).json, 'GET /v1/notes/n-01').toEqual({ id: 'n-01', title: L.n01, text: '', pinned: true });
  expect((await request(`${base}/v2/notes/n-01`)).json, 'GET /v2/notes/n-01').toEqual({ id: 'n-01', heading: L.n01, text: '', pinned: true });
});

test('an unexpected error answers 500 INTERNAL without the message or the stack', async () => {
  const repo = { ...createNotesRepo(seedNotes), get: async () => { throw new TypeError('secret detail'); } };
  const base = await start({ repo });
  const response = await request(`${base}/v1/notes/n-01`);
  expect(response.status, 'status when the repository throws').toBe(500);
  expect(codeOf(response), 'code when the repository throws').toBe('INTERNAL');
  expect(/secret detail|TypeError|\bat\s/.test(response.text), 'the answer contains the message or the stack').toBe(false);
});

test('an unknown address answers 404 and a wrong method 405 with Allow', async () => {
  const base = await start();
  const missing = await request(`${base}/v1/nothing`);
  expect(missing.status, 'status of GET /v1/nothing').toBe(404);
  const wrong = await request(`${base}/v1/notes`, { method: 'DELETE' });
  expect(wrong.status, 'status of DELETE /v1/notes').toBe(405);
  expect(wrong.headers.allow ?? '', 'Allow of DELETE /v1/notes').toMatch(/GET/);
});
