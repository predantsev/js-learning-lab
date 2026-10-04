// The policy table directly, then real HTTP requests to the notes service.
import { createApp } from './app.js';
import { can } from './policy.js';

const owner = { id: 'u-01', role: 'member' };
const reader = { id: 'u-02', role: 'member' };
const stranger = { id: 'u-03', role: 'member' };
const admin = { id: 'u-admin', role: 'admin' };
const note = () => ({ id: 'n-7', ownerId: 'u-01', readers: ['u-02'], title: 'x' });
const ACTIONS = ['read', 'update', 'delete', 'share'];
const allowed = (user) => ACTIONS.filter((action) => can(user, action, note()));

test('can: the owner may read, update, delete and share', () => {
  expect(allowed(owner), 'actions allowed to the owner').toEqual(ACTIONS);
});

test('can: a reader may only read', () => {
  expect(allowed(reader), 'actions allowed to a reader').toEqual(['read']);
});

test('can: an admin may read and delete, but not update or share', () => {
  expect(allowed(admin), 'actions allowed to an admin').toEqual(['read', 'delete']);
});

test('can: a stranger may do nothing, and an unknown action is refused to everyone', () => {
  expect(allowed(stranger), 'actions allowed to a stranger').toEqual([]);
  for (const user of [owner, reader, admin]) {
    expect(can(user, 'export', note()), `"export" for ${user.id}`).toBe(false);
  }
});

async function start() {
  const base = await listen(createApp());
  return (token, method, path, body) => request(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer lab-token-${token}` },
    body,
    signal: AbortSignal.timeout(2000),
  });
}

test('GET /notes lists only the notes the caller may read', async () => {
  const send = await start();
  const response = await send('u02', 'GET', '/notes');
  expect((response.json ?? []).map((n) => n.id).sort(), 'ids listed for u-02').toEqual(['n-1', 'n-2']);
});

test("a note the caller may not read answers 404 to GET, PATCH and DELETE and stays unchanged", async () => {
  const send = await start();
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const response = await send('u02', method, '/notes/n-3', method === 'PATCH' ? { title: 'hacked' } : undefined);
    expect(response.status, `status of u-02 ${method} /notes/n-3`).toBe(404);
  }
  const after = await send('u01', 'GET', '/notes/n-3');
  expect(after.json?.title, 'title of n-3 afterwards').toBe(L.diary);
});

test('a reader changing a shared note answers 403 and the note stays unchanged', async () => {
  const send = await start();
  expect((await send('u02', 'PATCH', '/notes/n-1', { title: 'hacked' })).status, 'status of u-02 PATCH /notes/n-1').toBe(403);
  expect((await send('u01', 'GET', '/notes/n-1')).json?.title, 'title of n-1 afterwards').toBe(L.gifts);
});

test('the admin deletes any note but gets 403 for editing one', async () => {
  const send = await start();
  expect((await send('admin', 'PATCH', '/notes/n-4', { title: 'edited' })).status, 'status of admin PATCH /notes/n-4').toBe(403);
  expect((await send('admin', 'DELETE', '/notes/n-4')).status, 'status of admin DELETE /notes/n-4').toBe(204);
});

test('the owner still reads, updates and deletes their own notes', async () => {
  const send = await start();
  expect((await send('u01', 'GET', '/notes/n-3')).status, 'status of u-01 GET /notes/n-3').toBe(200);
  const updated = await send('u01', 'PATCH', '/notes/n-3', { title: L.renamed });
  expect([updated.status, updated.json?.title], 'status and title of u-01 PATCH /notes/n-3').toEqual([200, L.renamed]);
  expect((await send('u01', 'DELETE', '/notes/n-3')).status, 'status of u-01 DELETE /notes/n-3').toBe(204);
});
