// Checks of hashPassword / verifyPassword. The test derives scrypt itself to confirm the stored hash.
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { promisify } from 'node:util';
import { hashPassword, verifyPassword } from './passwords.js';

const scrypt = promisify(crypto.scrypt);
const bytes = (base64) => Buffer.from(String(base64 ?? ''), 'base64');

test('hashPassword stores the scrypt parameters, a 16-byte salt and a 32-byte hash, never the password', async () => {
  const stored = await hashPassword('lantern-31');
  expect(stored?.algorithm, 'stored.algorithm').toBe('scrypt');
  expect([stored.N, stored.r, stored.p], '[N, r, p]').toEqual([16384, 8, 1]);
  expect(bytes(stored.salt).length, 'bytes in the salt').toBe(16);
  expect(bytes(stored.hash).length, 'bytes in the hash').toBe(32);
  expect(JSON.stringify(stored), 'the stored value as JSON').not.toContain('lantern-31');
});

test('the same password gives a different salt and hash every time', async () => {
  const first = await hashPassword('lantern-31');
  const second = await hashPassword('lantern-31');
  expect(first.salt === second.salt, 'both salts are equal').toBe(false);
  expect(first.hash === second.hash, 'both hashes are equal').toBe(false);
});

test('the stored hash is scrypt of the password with the stored salt', async () => {
  const stored = await hashPassword('lantern-31');
  const expected = await scrypt('lantern-31', bytes(stored.salt), 32, { N: 16384, r: 8, p: 1 });
  expect(stored.hash, 'stored.hash').toBe(expected.toString('base64'));
});

test('verifyPassword accepts the right password and refuses a wrong one', async () => {
  const stored = await hashPassword('lantern-31');
  expect(await verifyPassword('lantern-31', stored), 'the right password').toBe(true);
  expect(await verifyPassword('Lantern-31', stored), 'a password with another first letter').toBe(false);
  expect(await verifyPassword('', stored), 'an empty password').toBe(false);
});

test('verifyPassword uses the parameters stored with the hash', async () => {
  // A hash made earlier with a lower cost N=1024 (as if PARAMS had been different then).
  const salt = crypto.randomBytes(16);
  const hash = await scrypt('old-garden-5', salt, 32, { N: 1024, r: 8, p: 1 });
  const stored = { algorithm: 'scrypt', N: 1024, r: 8, p: 1, salt: salt.toString('base64'), hash: hash.toString('base64') };
  expect(await verifyPassword('old-garden-5', stored), 'a right password for an N=1024 hash').toBe(true);
});

test('verifyPassword answers false, without throwing, for a stored hash of another length', async () => {
  const stored = { ...(await hashPassword('lantern-31')), hash: crypto.randomBytes(16).toString('base64') };
  let result;
  let thrown = null;
  try {
    result = await verifyPassword('lantern-31', stored);
  } catch (error) {
    thrown = `${error.name}: ${error.message}`;
  }
  expect(thrown, 'error thrown by verifyPassword').toBeNull();
  expect(result, 'result for a 16-byte stored hash').toBe(false);
});

test('verifyPassword compares the hashes with crypto.timingSafeEqual', async () => {
  const stored = await hashPassword('lantern-31');
  const original = crypto.timingSafeEqual;
  let calls = 0;
  crypto.timingSafeEqual = (a, b) => {
    calls += 1;
    return original(a, b);
  };
  syncBuiltinESMExports(); // named imports of node:crypto see the counting version too
  try {
    await verifyPassword('lantern-31', stored);
    await verifyPassword('lantern-32', stored);
  } finally {
    crypto.timingSafeEqual = original;
    syncBuiltinESMExports();
  }
  expect(calls, 'calls of crypto.timingSafeEqual for two logins').toBe(2);
});
