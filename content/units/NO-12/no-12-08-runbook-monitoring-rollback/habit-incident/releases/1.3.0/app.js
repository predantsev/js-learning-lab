// Habit service 1.3.0: reads data of schema version 1 only.
import { readFile } from 'node:fs/promises';
import { serve } from '../common.js';

export const version = '1.3.0';
export const supportsSchema = 1;

export async function start({ dataDir, log }) {
  const data = JSON.parse(await readFile(`${dataDir}/habits.json`, 'utf8'));
  if (data.schemaVersion !== supportsSchema) throw new Error(`unsupported schemaVersion ${data.schemaVersion}`);
  const streak = (habit) => habit.completions.length; // simplified: completed days
  return serve({
    '/readyz': () => ({ status: 'ready', version }),
    '/habits': () => data.records,
    '/habits/streaks': (url) => {
      const habit = data.records.find((h) => h.id === url.searchParams.get('id'));
      return { id: habit.id, streak: streak(habit) };
    },
  }, { log });
}
