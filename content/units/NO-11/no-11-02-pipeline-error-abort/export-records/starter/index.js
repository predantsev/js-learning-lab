// Three exports into habits.jsonl: a complete one, one whose source fails at record 300,
// and one aborted after 30 ms. After each it prints the outcome and the files in the folder.
import { readdir, readFile } from 'node:fs/promises';
import { habitSource } from './habit-source.js';
import { exportRecords } from './app.js';

async function show(label, run) {
  try {
    await run();
    console.log(`${label}: %%ok%%`);
  } catch (error) {
    console.log(`${label}: ${error.name}: ${error.message}`);
  }
  const files = (await readdir('.')).filter((name) => name.startsWith('habits'));
  const lines = files.includes('habits.jsonl') ? (await readFile('habits.jsonl', 'utf8')).split('\n').length - 1 : 0;
  console.log(`  %%files%%: ${files.join(', ') || '—'}; %%linesIn%% habits.jsonl: ${lines}`);
}

await show('%%complete%%', () => exportRecords(habitSource({ count: 1000 }), 'habits.jsonl'));
await show('%%failing%%', () => exportRecords(habitSource({ count: 1000, failAt: 300 }), 'habits.jsonl'));
await show('%%abort%%', () =>
  exportRecords(habitSource({ count: 1000, delayMs: 20 }), 'habits.jsonl', { signal: AbortSignal.timeout(30) }),
);
