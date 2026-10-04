// Password storage with the callback form of crypto.scrypt wrapped by hand.
import crypto from 'node:crypto';

const N = 16384;
const r = 8;
const p = 1;

function derive(password, salt, length, params) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, length, params, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await derive(password, salt, 32, { N, r, p });
  return { algorithm: 'scrypt', N, r, p, salt: salt.toString('base64'), hash: hash.toString('base64') };
}

export async function verifyPassword(password, stored) {
  const expected = Buffer.from(stored.hash, 'base64');
  // Derive exactly as many bytes as were stored, so the lengths always match.
  const candidate = await derive(password, Buffer.from(stored.salt, 'base64'), expected.length || 32, {
    N: stored.N,
    r: stored.r,
    p: stored.p,
  });
  return crypto.timingSafeEqual(candidate, expected);
}
