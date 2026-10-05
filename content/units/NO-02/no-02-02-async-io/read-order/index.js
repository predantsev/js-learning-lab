// The same read done two ways: with fs/promises and with readFileSync. Watch where the timer lands.
import { readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const mode = 'promises'; // try 'sync'

const started = performance.now();
const ms = () => `${Math.round(performance.now() - started)} ms`;

console.log('start');
setTimeout(() => console.log(`timer (${ms()})`), 0);

// A synthetic 5 MB log of planner events. Writing it takes a few ms, so the timer is already due.
writeFileSync('planner-log.txt', '2026-03-02 t-01 done\n'.repeat(250_000));

const text = mode === 'sync' ? readFileSync('planner-log.txt', 'utf8') : await readFile('planner-log.txt', 'utf8');
console.log(`read ${text.length} characters (${ms()})`);
console.log('end');
