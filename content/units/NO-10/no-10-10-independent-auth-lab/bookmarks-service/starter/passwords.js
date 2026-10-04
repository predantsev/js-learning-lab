// Password hashing for the bookmarks lab. Write both functions by the task.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export async function hashPassword(password) {
  return null;
}

export async function verifyPassword(password, stored) {
  return false;
}
