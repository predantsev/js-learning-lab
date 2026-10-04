// Password storage for the lab's synthetic users.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

// Parameters for NEW hashes. Old hashes keep the parameters stored with them.
export const PARAMS = { N: 16384, r: 8, p: 1, keyLength: 32, saltLength: 16 };

// Returns what the server stores instead of the password:
// { algorithm: 'scrypt', N, r, p, salt, hash } — salt and hash as base64 text.
export async function hashPassword(password) {
  // TODO
  return { algorithm: 'scrypt', N: PARAMS.N, r: PARAMS.r, p: PARAMS.p, salt: '', hash: '' };
}

// true when `password` matches the stored value, otherwise false.
export async function verifyPassword(password, stored) {
  // TODO
  return false;
}
