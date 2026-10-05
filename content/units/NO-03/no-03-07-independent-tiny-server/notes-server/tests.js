import { createNotesServer } from './notes.js';

const seed = [
  { id: 'n-01', text: L.note1 },
  { id: 'n-02', text: L.note2 },
  { id: 'n-03', text: L.note3 },
];

// A fresh server for every check; each request gives up after 1 s.
async function fresh() {
  const base = await listen(createNotesServer());
  return (method, path, body, headers = {}) =>
    request(base + path, { method, body, headers: { 'content-type': 'application/json', ...headers }, signal: AbortSignal.timeout(1000) })
      .catch((error) => ({ status: `no answer within 1 s (${error.name})`, headers: {}, json: undefined }));
}

test('GET /notes answers 200 with every note', async () => {
  const send = await fresh();
  const response = await send('GET', '/notes');
  expect(response.status, 'status of GET /notes').toBe(200);
  expect(response.json, 'body of GET /notes').toEqual(seed);
});

test('GET /notes/:id answers 200 with that note', async () => {
  const send = await fresh();
  const response = await send('GET', '/notes/n-02');
  expect(response.status, 'status of GET /notes/n-02').toBe(200);
  expect(response.json, 'body of GET /notes/n-02').toEqual(seed[1]);
});

test('a missing note answers 404', async () => {
  const send = await fresh();
  expect((await send('GET', '/notes/n-99')).status, 'status of GET /notes/n-99').toBe(404);
});

test('POST /notes creates a note that GET /notes then lists', async () => {
  const send = await fresh();
  const created = await send('POST', '/notes', JSON.stringify({ text: L.newNote }));
  expect(created.status, 'status of POST /notes with valid text').toBe(201);
  expect(typeof created.json?.id, 'type of the new note’s id').toBe('string');
  expect(created.json?.text, 'text of the new note').toBe(L.newNote);
  const list = await send('GET', '/notes');
  expect(list.json?.map((n) => n.id), 'ids in GET /notes after the POST').toEqual(['n-01', 'n-02', 'n-03', created.json?.id]);
});

test('malformed JSON answers 400', async () => {
  const send = await fresh();
  expect((await send('POST', '/notes', '{"text": "' + L.newNote)).status, 'status of a cut-off JSON body').toBe(400);
});

test('a note without valid text answers 400', async () => {
  const send = await fresh();
  expect((await send('POST', '/notes', JSON.stringify({ title: L.newNote }))).status, 'status of a body without text').toBe(400);
  expect((await send('POST', '/notes', JSON.stringify({ text: '   ' }))).status, 'status of a body whose text is only spaces').toBe(400);
  expect((await send('POST', '/notes', JSON.stringify({ text: 'x'.repeat(201) }))).status, 'status of a 201-character text').toBe(400);
});

test('a body over 1 KB answers 413', async () => {
  const send = await fresh();
  expect((await send('POST', '/notes', JSON.stringify({ text: 'x'.repeat(8 * 1024) }))).status, 'status of an 8 KB body').toBe(413);
});

test('a body of exactly 1 KB is read, not refused', async () => {
  const send = await fresh();
  const body = JSON.stringify({ text: 'ok', pad: 'x'.repeat(1024 - JSON.stringify({ text: 'ok', pad: '' }).length) }); // 1024 bytes
  expect((await send('POST', '/notes', body)).status, `status of a body of exactly ${Buffer.byteLength(body)} bytes`).toBe(201);
});

test('a wrong method answers 405 with Allow', async () => {
  const send = await fresh();
  const list = await send('DELETE', '/notes');
  expect(list.status, 'status of DELETE /notes').toBe(405);
  expect(list.headers.allow ?? '(no Allow header)', 'Allow header of DELETE /notes').toMatch(/GET.*POST|POST.*GET/);
  const one = await send('PUT', '/notes/n-01', JSON.stringify({ text: 'x' }));
  expect(one.status, 'status of PUT /notes/n-01').toBe(405);
  expect(one.headers.allow ?? '(no Allow header)', 'Allow header of PUT /notes/n-01').toMatch(/GET/);
});

test('an unknown path answers 404', async () => {
  const send = await fresh();
  expect((await send('GET', '/nothing-here')).status, 'status of GET /nothing-here').toBe(404);
});

test('every answer is JSON', async () => {
  const send = await fresh();
  for (const [method, path, body] of [['GET', '/notes'], ['GET', '/notes/n-99'], ['POST', '/notes', '{'], ['DELETE', '/notes'], ['GET', '/nothing-here']]) {
    const response = await send(method, path, body);
    if (typeof response.status !== 'number') continue; // a route that never answers fails its own check
    expect(response.headers['content-type'] ?? '(no Content-Type)', `Content-Type of ${method} ${path}`).toMatch(/^application\/json/);
    expect(response.json, `body of ${method} ${path} parsed as JSON`).toBeDefined();
  }
});
