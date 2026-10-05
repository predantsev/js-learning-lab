import { createMemorySecretStore } from './secretStore.ts';

const OK_NULL = { ok: true, value: null };

test('set, get and delete resolve with ok results', async () => {
  expect(typeof createMemorySecretStore, 'type of createMemorySecretStore').toBe('function');
  const store = createMemorySecretStore();
  expect(await store.setSecret('session.token', 'tok_a1'), 'setSecret result').toEqual(OK_NULL);
  expect(await store.getSecret('session.token'), 'getSecret after setSecret').toEqual({ ok: true, value: 'tok_a1' });
  expect(await store.setSecret('session.token', 'tok_b2'), 'second setSecret result').toEqual(OK_NULL);
  expect(await store.getSecret('session.token'), 'getSecret after a second setSecret').toEqual({ ok: true, value: 'tok_b2' });
  expect(await store.deleteSecret('session.token'), 'deleteSecret result').toEqual(OK_NULL);
  expect(await store.getSecret('session.token'), 'getSecret after deleteSecret').toEqual(OK_NULL);
});

test('a key that was never set gives ok with null', async () => {
  expect(typeof createMemorySecretStore, 'type of createMemorySecretStore').toBe('function');
  const store = createMemorySecretStore();
  expect(await store.getSecret('refresh.token'), 'getSecret("refresh.token")').toEqual(OK_NULL);
  expect(await store.getSecret('toString'), 'getSecret("toString")').toEqual(OK_NULL);
});

test('an invalid key is refused by every method and nothing is stored', async () => {
  expect(typeof createMemorySecretStore, 'type of createMemorySecretStore').toBe('function');
  const store = createMemorySecretStore();
  const refused = { ok: false, error: 'invalid-key' };
  expect(await store.setSecret('session token', 'tok_c3'), 'setSecret("session token", …)').toEqual(refused);
  expect(await store.getSecret('session token'), 'getSecret("session token")').toEqual(refused);
  expect(await store.deleteSecret('session/token'), 'deleteSecret("session/token")').toEqual(refused);
  expect(await store.setSecret('', 'tok_c3'), 'setSecret("", …)').toEqual(refused);
  expect(await store.getSecret('session_token'), 'getSecret("session_token") — nothing was stored').toEqual(OK_NULL);
});

test('a value longer than 2048 characters is refused and the old value stays', async () => {
  expect(typeof createMemorySecretStore, 'type of createMemorySecretStore').toBe('function');
  const store = createMemorySecretStore();
  await store.setSecret('session.token', 'tok_d4');
  expect(await store.setSecret('session.token', 'x'.repeat(2049)), 'setSecret with 2049 characters').toEqual({ ok: false, error: 'too-large' });
  expect(await store.getSecret('session.token'), 'getSecret after the refused value').toEqual({ ok: true, value: 'tok_d4' });
  expect(await store.setSecret('session.token', 'y'.repeat(2048)), 'setSecret with exactly 2048 characters').toEqual(OK_NULL);
});

test('an unavailable store refuses every call', async () => {
  expect(typeof createMemorySecretStore, 'type of createMemorySecretStore').toBe('function');
  const store = createMemorySecretStore({ available: false });
  const refused = { ok: false, error: 'unavailable' };
  expect(await store.setSecret('session.token', 'tok_e5'), 'setSecret on an unavailable store').toEqual(refused);
  expect(await store.getSecret('session.token'), 'getSecret on an unavailable store').toEqual(refused);
  expect(await store.deleteSecret('session.token'), 'deleteSecret on an unavailable store').toEqual(refused);
});

test('two stores do not share secrets', async () => {
  expect(typeof createMemorySecretStore, 'type of createMemorySecretStore').toBe('function');
  const first = createMemorySecretStore();
  const second = createMemorySecretStore();
  await first.setSecret('session.token', 'only-in-the-first');
  expect(await second.getSecret('session.token'), 'getSecret on the second store').toEqual(OK_NULL);
});

test('the secret store leaves localStorage untouched', async () => {
  expect(typeof createMemorySecretStore, 'type of createMemorySecretStore').toBe('function');
  storage.clear();
  await createMemorySecretStore().setSecret('session.token', 'tok_f6');
  expect(storage.length, 'number of keys in localStorage').toBe(0);
});
