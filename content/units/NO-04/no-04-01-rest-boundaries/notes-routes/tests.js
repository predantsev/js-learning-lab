// Real HTTP requests to the API built from the learner's route table.
import { createApp } from './app.js';

const start = () => listen(createApp());

test('list: GET /notes answers 200 with every note', async () => {
  const response = await request(`${await start()}/notes`);
  expect(response.status, 'status of GET /notes').toBe(200);
  expect((response.json ?? []).map((note) => note.id), 'ids in GET /notes').toEqual(['n-1', 'n-2']);
});

test('read: GET /notes/:id answers 200 with that note', async () => {
  const response = await request(`${await start()}/notes/n-2`);
  expect(response.status, 'status of GET /notes/n-2').toBe(200);
  expect(response.json?.title, 'title in GET /notes/n-2').toBe(L.shopping);
});

test('create: POST /notes answers 201 and adds the note', async () => {
  const base = await start();
  const response = await request(`${base}/notes`, { method: 'POST', body: { title: L.newTitle } });
  expect(response.status, 'status of POST /notes').toBe(201);
  expect(response.json?.title, 'title of the created note').toBe(L.newTitle);
  const list = await request(`${base}/notes`);
  expect((list.json ?? []).length, 'notes after POST /notes').toBe(3);
});

test('replace: PUT /notes/:id answers 200 and keeps only the fields sent', async () => {
  const base = await start();
  const response = await request(`${base}/notes/n-1`, { method: 'PUT', body: { title: L.renamed } });
  expect(response.status, 'status of PUT /notes/n-1').toBe(200);
  const after = await request(`${base}/notes`);
  expect((after.json ?? []).find((note) => note.id === 'n-1'), 'note n-1 after PUT').toEqual({ id: 'n-1', title: L.renamed });
});

test('update: PATCH /notes/:id answers 200 and changes only the fields sent', async () => {
  const base = await start();
  const response = await request(`${base}/notes/n-1`, { method: 'PATCH', body: { pinned: true } });
  expect(response.status, 'status of PATCH /notes/n-1').toBe(200);
  const after = await request(`${base}/notes`);
  expect((after.json ?? []).find((note) => note.id === 'n-1'), 'note n-1 after PATCH').toEqual({ id: 'n-1', title: L.gifts, text: L.giftsText, pinned: true });
});

test('remove: DELETE /notes/:id answers 204 and the note is gone', async () => {
  const base = await start();
  const response = await request(`${base}/notes/n-2`, { method: 'DELETE' });
  expect(response.status, 'status of DELETE /notes/n-2').toBe(204);
  const after = await request(`${base}/notes`);
  expect((after.json ?? []).map((note) => note.id), 'ids after DELETE /notes/n-2').toEqual(['n-1']);
});

test('a missing note answers 404 for read, replace, update and remove', async () => {
  const base = await start();
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
    const body = method === 'PUT' || method === 'PATCH' ? { title: L.renamed } : undefined;
    const response = await request(`${base}/notes/n-9`, { method, body });
    expect(response.status, `status of ${method} /notes/n-9`).toBe(404);
    expect(response.json?.error, `${method} /notes/n-9 reached a row of the table`).toBe('note not found');
  }
});
