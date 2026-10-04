// The supplied check, for your terminal: node check.mjs
// 5 rounds: start server.mjs, send waves of concurrent bookings (some for an already taken room and
// day), kill the server with SIGKILL at a random moment, restart it and check that every confirmed
// booking is there and no room is double-booked. Then back up the store, restore it into scratch and
// compare. Deletes and recreates only check-data/ in this folder.
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { checkInvariants } from './invariants.js';
import { backupStore, verifyBackup } from './store.js';

const FILE = 'check-data/bookings';
const ROUNDS = 5;
const confirmed = [];
let next = 0;

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server.mjs'], { env: { ...process.env, BOOKINGS_FILE: FILE, PORT: '0' } });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = /listening (\d+)/.exec(output);
      if (match) resolve({ child, base: `http://127.0.0.1:${match[1]}` });
    });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('exit', (code) => reject(new Error(`server.mjs exited with code ${code} before listening:\n${output.trim()}`)));
  });
}

async function post(base, booking) {
  try {
    const response = await fetch(`${base}/bookings`, { method: 'POST', body: JSON.stringify(booking), signal: AbortSignal.timeout(2000) });
    if (response.status === 201) confirmed.push(booking.id);
    return response.status;
  } catch {
    return 'no answer';
  }
}

function booking(n) {
  const slot = n % 7 === 6 ? n - 3 : n; // every 7th asks for a room and day that is already taken
  const day = new Date(Date.UTC(2027, 0, 1 + Math.floor(slot / 3))).toISOString().slice(0, 10);
  return { id: `c-${n}`, room: 'ABC'[slot % 3], date: day, guests: 1 + (n % 8) };
}

await rm('check-data', { recursive: true, force: true });
await mkdir('check-data/scratch', { recursive: true });
let failures = 0;

for (let round = 1; round <= ROUNDS; round++) {
  const { child, base } = await startServer();
  const killAfter = 150 + Math.floor(Math.random() * 200);
  const killed = new Promise((resolve) => setTimeout(() => { child.kill('SIGKILL'); resolve(); }, killAfter));
  let stop = false;
  killed.then(() => { stop = true; });
  while (!stop) {
    await Promise.all(Array.from({ length: 10 }, () => post(base, booking(next++))));
  }
  await new Promise((resolve) => (child.exitCode === null && child.signalCode === null ? child.once('exit', resolve) : resolve()));

  const restarted = await startServer();
  const bookings = await (await fetch(`${restarted.base}/bookings`)).json();
  restarted.child.kill('SIGKILL');
  await new Promise((resolve) => restarted.child.once('exit', resolve));
  const problems = checkInvariants(bookings, confirmed);
  if (problems.length > 0) failures += 1;
  console.log(`round ${round}: killed after ${killAfter} ms, ${bookings.length} bookings, ${confirmed.length} confirmed — ${problems.length === 0 ? 'ok' : `${problems.slice(0, 2).join('; ')}${problems.length > 2 ? ` (+${problems.length - 2} more)` : ''}`}`);
}

const manifest = await backupStore(FILE, 'check-data/bookings.backup');
const report = await verifyBackup('check-data/bookings.backup', 'check-data/scratch');
console.log(`backup: ${JSON.stringify(manifest)}`);
console.log(`restore drill: ${JSON.stringify(report)}`);
if (!report.ok) failures += 1;
console.log(failures === 0 ? `all ${ROUNDS} rounds ok, backup verified` : `${failures} problem(s) found`);
