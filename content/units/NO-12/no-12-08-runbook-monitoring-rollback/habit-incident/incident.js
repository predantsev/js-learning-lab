// Plays an incident in simulated minutes: deploy 1.4.0, watch the error rate, follow RUNBOOK.md.
// Simulation, not a real deployment: both releases are modules in this one process, a "minute" is
// 40 requests sent back to back, and "deploy" means stopping one server and starting another.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import * as v130 from './releases/1.3.0/app.js';
import * as v140 from './releases/1.4.0/app.js';

const CHECK_DATA = true; // the runbook's "data check before rollback"
const logs = [];
const log = (entry) => logs.push(entry);
const ids = ['h-01', 'h-02', 'h-03', 'h-04', 'h-05', 'h-06'];

await rm('data', { recursive: true, force: true });
await mkdir('data/backups', { recursive: true });
await writeFile('data/habits.json', JSON.stringify({
  schemaVersion: 1,
  records: [
    { id: 'h-01', name: '%%exercise%%', completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
    { id: 'h-02', name: '%%reading%%', completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
    { id: 'h-03', name: '%%water%%', completions: ['2026-03-01'] },
    { id: 'h-04', name: '%%tidy%%', completions: ['2026-02-22', '2026-03-01'] },
    { id: 'h-05', name: '%%words%%', completions: ['2026-02-20'] },
    { id: 'h-06', name: '%%walk%%', completions: [] },
  ],
}));

async function minute(server) {
  const base = `http://127.0.0.1:${server.address().port}`;
  const before = await (await fetch(`${base}/metrics`)).json();
  for (let i = 0; i < 40; i++) {
    const path = i % 2 === 0 ? '/habits' : `/habits/streaks?id=${ids[i % ids.length]}`;
    await (await fetch(base + path, { signal: AbortSignal.timeout(2000) })).text();
  }
  const after = await (await fetch(`${base}/metrics`)).json();
  return { requests: after.requests - before.requests - 1, errors: after.errors - before.errors };
}
const stop = (server) => { server.closeAllConnections(); server.close(); };

console.log('▶ %%deploy%% 1.4.0 (%%backupFirst%%)');
await copyFile('data/habits.json', 'data/backups/habits-before-1.4.0.json');
let server = await v140.start({ dataDir: 'data', log });

let bad = 0;
for (let m = 1; m <= 3 && bad < 2; m++) {
  const { requests, errors } = await minute(server);
  const rate = errors / requests;
  bad = rate > 0.05 && requests >= 20 ? bad + 1 : 0;
  console.log(`  %%minute%% ${m}: ${errors}/${requests} = ${(rate * 100).toFixed(1)} %${bad >= 2 ? '  ← ALERT' : ''}`);
}

if (bad < 2) {
  console.log('✔ %%noAlert%%');
  stop(server);
  process.exit(0);
}

console.log('▶ %%checks%%');
const base = `http://127.0.0.1:${server.address().port}`;
console.log(`  /readyz → ${(await fetch(`${base}/readyz`)).status}`);
const errorLines = logs.filter((line) => line.level === 'error');
console.log(`  ${errorLines.length} %%errorLines%%; %%first%%: ${JSON.stringify(errorLines[0])}`);
console.log('  %%release%%: 1.4.0 %%justDeployed%%; 1.3.0 %%kept%%');

console.log('▶ %%dataCheck%%');
const schema = JSON.parse(await readFile('data/habits.json', 'utf8')).schemaVersion;
console.log(`  %%dataSchema%% ${schema}, 1.3.0 %%supports%% ${v130.supportsSchema}`);
stop(server);
if (CHECK_DATA && schema > v130.supportsSchema) {
  await copyFile('data/backups/habits-before-1.4.0.json', 'data/habits.json');
  console.log('  %%restored%% data/backups/habits-before-1.4.0.json');
}

console.log('▶ %%rollback%% 1.3.0');
try {
  server = await v130.start({ dataDir: 'data', log });
} catch (error) {
  console.log(`  ✖ 1.3.0 %%didNotStart%%: ${error.message}`);
  process.exit(0);
}
const { requests, errors } = await minute(server);
console.log(`▶ %%confirm%%: /readyz → ${(await fetch(`http://127.0.0.1:${server.address().port}/readyz`)).status}, ${errors}/${requests} = ${((errors / requests) * 100).toFixed(1)} %`);
stop(server);
