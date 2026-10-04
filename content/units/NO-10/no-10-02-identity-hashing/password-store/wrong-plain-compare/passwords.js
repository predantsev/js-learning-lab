// Password storage for the lab's synthetic users.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

// Parameters for NEW hashes. Old hashes keep the parameters stored with them.
export const PARAMS = { N: 16384, r: 8, p: 1, keyLength: 32, saltLength: 16 };

// Returns what the server stores instead of the password:
// { algorithm: 'scrypt', N, r, p, salt, hash } — salt and hash as base64 text.
export async function hashPassword(password) {
  const { N, r, p, keyLength, saltLength } = PARAMS;
  const salt = crypto.randomBytes(saltLength);
  const hash = await scrypt(password, salt, keyLength, { N, r, p });
  return { algorithm: 'scrypt', N, r, p, salt: salt.toString('base64'), hash: hash.toString('base64') };
}

// true when `password` matches the stored value, otherwise false.
export async function verifyPassword(password, stored) {
  const salt = Buffer.from(stored.salt, 'base64');
  const expected = Buffer.from(stored.hash, 'base64');
  const { N, r, p } = stored; // the parameters this hash was made with
  const candidate = await scrypt(password, salt, PARAMS.keyLength, { N, r, p });
  // timingSafeEqual throws on different lengths, so a stored hash of another length is "no".
  if (candidate.length !== expected.length) return false;
  return candidate.toString('base64') === stored.hash;
}
