// Password storage for the lab's synthetic users (callback scrypt wrapped by hand).
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export const PARAMS = { N: 16384, r: 8, p: 1, keyLength: 32, saltLength: 16 };

function derive(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password) {
  const salt = randomBytes(PARAMS.saltLength);
  const options = { N: PARAMS.N, r: PARAMS.r, p: PARAMS.p };
  const hash = await derive(password, salt, PARAMS.keyLength, options);
  return { algorithm: 'scrypt', ...options, salt: salt.toString('base64'), hash: hash.toString('base64') };
}

export async function verifyPassword(password, stored) {
  if (stored?.algorithm !== 'scrypt') return false;
  const expected = Buffer.from(stored.hash, 'base64');
  // Derive exactly as many bytes as were stored; an empty hash can never match.
  if (expected.length === 0) return false;
  const candidate = await derive(password, Buffer.from(stored.salt, 'base64'), expected.length, {
    N: stored.N,
    r: stored.r,
    p: stored.p,
  });
  return timingSafeEqual(candidate, expected);
}
