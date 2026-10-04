// Two independent reads: one after the other, then both at once. Compare the time.
import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

// Two synthetic 8 MB exports that do not depend on each other.
writeFileSync('habits-export.txt', '2026-03-01 h-01 done\n'.repeat(400_000));
writeFileSync('expenses-export.txt', '2026-03-01 e-01 84550\n'.repeat(400_000));

async function sequential() {
  const habits = await readFile('habits-export.txt', 'utf8');
  const expenses = await readFile('expenses-export.txt', 'utf8'); // starts only after habits finished
  return habits.length + expenses.length;
}

async function together() {
  // Both reads start now; Promise.all waits until both have finished.
  const [habits, expenses] = await Promise.all([readFile('habits-export.txt', 'utf8'), readFile('expenses-export.txt', 'utf8')]);
  return habits.length + expenses.length;
}

for (const [label, load] of [['one after the other', sequential], ['Promise.all', together]]) {
  const started = performance.now();
  const characters = await load();
  console.log(`${label}: ${characters} characters in ${(performance.now() - started).toFixed(1)} ms`);
}
