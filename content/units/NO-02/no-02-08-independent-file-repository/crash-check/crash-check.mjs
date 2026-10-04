// Kills a saving process at a random moment, restarts the repository and checks the data — 20 times.
// Run it in a folder that holds repository.js, save-loop.mjs and invariants.js:  node crash-check.mjs
// The kill is real (SIGKILL: the process gets no chance to clean up). It is not a power cut: data the
// operating system already accepted survives a killed process, so this check cannot tell whether
// sync() was called.
import { spawn } from 'node:child_process';
import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { checkInvariants } from './invariants.js';
import { createFileRepository } from './repository.js';

const ROUNDS = 20;
const dataDir = path.join(import.meta.dirname, 'crash-data');
await rm(dataDir, { recursive: true, force: true });
await mkdir(dataDir);

const confirmed = new Set();
let failedRounds = 0;
for (let round = 1; round <= ROUNDS; round++) {
  const child = spawn(process.execPath, [path.join(import.meta.dirname, 'save-loop.mjs'), dataDir], { stdio: ['ignore', 'pipe', 'pipe'] });
  let errors = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (text) => {
    for (const line of text.split('\n')) if (line.startsWith('saved ')) confirmed.add(line.slice(6));
  });
  child.stderr.on('data', (text) => (errors += text));
  const exited = new Promise((resolve) => child.on('exit', resolve));
  const killAfter = 100 + Math.floor(Math.random() * 150);
  await new Promise((resolve) => setTimeout(resolve, killAfter));
  child.kill('SIGKILL');
  await exited;

  // The restart: a fresh repository object, as after a real start of the server.
  const repo = createFileRepository(dataDir, { maxBytes: 4 * 1024 * 1024 });
  let problems;
  let count = 0;
  try {
    await repo.recover();
    const records = await repo.list();
    count = records.length;
    problems = checkInvariants(records, confirmed);
  } catch (error) {
    problems = [`after the restart: ${error.message}${error.cause ? ` (cause: ${error.cause.message})` : ''}`];
  }
  if (errors.trim() !== '' && problems.length === 0) problems.push(`the saving process failed on its own: ${errors.trim().split('\n')[0]}`);
  const leftovers = (await readdir(dataDir)).filter((name) => name.endsWith('.tmp')).length;
  if (leftovers > 0) problems.push(`${leftovers} .tmp file(s) left after recover()`);
  console.log(`round ${String(round).padStart(2)}: killed after ${killAfter} ms, ${count} records, ${confirmed.size} confirmed — ${problems.length === 0 ? 'ok' : problems.join('; ')}`);
  if (problems.length > 0) failedRounds += 1;
}
console.log(failedRounds === 0 ? `all ${ROUNDS} rounds ok` : `${failedRounds} of ${ROUNDS} rounds lost or damaged data`);
process.exitCode = failedRounds === 0 ? 0 : 1;
