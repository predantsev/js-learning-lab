// Two synthetic users with the same password, stored two ways: plain SHA-256 and salted scrypt.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const COST = 16384; // N, the cost parameter: Node's default
const MAXMEM = 32 * 1024 * 1024; // scrypt's memory cap: Node's default

const users = [
  { id: 'u-01', name: '%%marta%%', password: 'sunflower-42' },
  { id: 'u-02', name: '%%bohdan%%', password: 'sunflower-42' },
];

// Shortens a long value for printing.
const short = (text) => `${text.slice(0, 12)}…`;

console.log('SHA-256:');
for (const user of users) {
  const digest = crypto.createHash('sha256').update(user.password).digest('base64');
  console.log(`  ${user.id} ${user.name}: ${short(digest)}`);
}

console.log('scrypt:');
const stored = new Map();
for (const user of users) {
  const salt = crypto.randomBytes(16); // a new random salt for every user
  const hash = await scrypt(user.password, salt, 32, { N: COST, maxmem: MAXMEM });
  stored.set(user.id, { N: COST, salt, hash }); // salt, parameters and hash — never the password
  console.log(`  ${user.id} ${user.name}: %%salt%% ${short(salt.toString('base64'))} hash ${short(hash.toString('base64'))}`);
}

// Timing: one warm-up round first, so the first call's start-up cost is not measured.
await scrypt('warm-up', 'salt', 32, { N: COST, maxmem: MAXMEM });
const started = performance.now();
await scrypt('sunflower-42', 'salt', 32, { N: COST, maxmem: MAXMEM });
console.log(`%%oneHash%% N=${COST}: ${(performance.now() - started).toFixed(0)} ms`);

// Login: re-derive with the STORED salt and parameters, then compare in constant time.
async function verify(userId, attempt) {
  const { N, salt, hash } = stored.get(userId);
  const candidate = await scrypt(attempt, salt, hash.length, { N, maxmem: MAXMEM });
  return crypto.timingSafeEqual(candidate, hash);
}
console.log(`u-01 + sunflower-42: ${await verify('u-01', 'sunflower-42')}`);
console.log(`u-01 + sunflower-43: ${await verify('u-01', 'sunflower-43')}`);
