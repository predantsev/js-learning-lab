// Registers three synthetic users, prints what is stored, then tries four logins.
import { hashPassword, verifyPassword } from './passwords.js';

const registrations = [
  ['u-01', 'sunflower-42'],
  ['u-02', 'sunflower-42'],
  ['u-03', 'river-stone-7'],
];

const store = new Map();
for (const [userId, password] of registrations) {
  const stored = await hashPassword(password);
  store.set(userId, stored);
  console.log(`${userId}: ${JSON.stringify(stored)}`);
}

const attempts = [
  ['u-01', 'sunflower-42'],
  ['u-01', 'Sunflower-42'],
  ['u-03', 'river-stone-7'],
  ['u-03', 'sunflower-42'],
];
for (const [userId, password] of attempts) {
  console.log(`%%login%% ${userId} / ${password}: ${await verifyPassword(password, store.get(userId))}`);
}
