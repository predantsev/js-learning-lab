// Synthetic users and their password hashes (scrypt, as in the previous lesson).
// The hashes are made here at start-up only because the lab has no registration form.
import crypto from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1 };

function makeRecord(id, password) {
  const salt = crypto.randomBytes(16);
  return { id, salt, hash: crypto.scryptSync(password, salt, 32, PARAMS) };
}

const records = new Map([
  ['u-01', makeRecord('u-01', 'sunflower-42')],
  ['u-02', makeRecord('u-02', 'river-stone-7')],
]);

// true when the password matches the stored hash of this user.
export function checkPassword(userId, password) {
  const record = records.get(userId);
  if (!record || typeof password !== 'string') return false;
  const candidate = crypto.scryptSync(password, record.salt, 32, PARAMS);
  return crypto.timingSafeEqual(candidate, record.hash);
}
