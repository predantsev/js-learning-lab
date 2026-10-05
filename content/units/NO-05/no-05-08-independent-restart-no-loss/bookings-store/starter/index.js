// Starts the bookings store, adds two bookings at once for the same room and day, "restarts",
// takes a backup and verifies it. Everything it prints comes from your store.js.
import { mkdir, rm } from 'node:fs/promises';
import { backupStore, initStore, openRepository, verifyBackup } from './store.js';

const fixtures = [
  { id: 'k-01', room: 'A', date: '2026-03-02', guests: 2, note: '%%quiet%%' },
  { id: 'k-02', room: 'B', date: '2026-03-02', guests: 4, note: '' },
];

async function step(label, work) {
  try {
    console.log(`${label}: ${JSON.stringify(await work())}`);
  } catch (error) {
    console.log(`${label}: ${error.name}: ${error.message}`);
  }
}

await rm('data', { recursive: true, force: true });
await mkdir('data/backups', { recursive: true });
await mkdir('data/scratch', { recursive: true });

await step('initStore', () => initStore('data/bookings.json', fixtures));
const repo = await openRepository('data/bookings.json');
await step('two adds for room C on 2026-03-05', () => Promise.allSettled([
  repo.add({ id: 'k-03', room: 'C', date: '2026-03-05', guests: 1 }),
  repo.add({ id: 'k-04', room: 'C', date: '2026-03-05', guests: 3 }),
]).then((results) => results.map((result) => result.status)));
await repo.close?.();
const restarted = await openRepository('data/bookings.json');
await step('after a restart', async () => (await restarted.list()).map((booking) => booking.id));
await restarted.close?.();
await step('backupStore', () => backupStore('data/bookings.json', 'data/backups/bookings.1'));
await step('verifyBackup', () => verifyBackup('data/backups/bookings.1', 'data/scratch'));
