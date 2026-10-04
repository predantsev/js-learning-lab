// Habit service 1.4.0: migrates the data to schema version 2 on start (completions → doneDates)
// and adds the day of the last completion to /habits/streaks.
import { readFile, rename, writeFile } from 'node:fs/promises';
import { serve } from '../common.js';

export const version = '1.4.0';
export const supportsSchema = 2;

export async function start({ dataDir, log }) {
  const file = `${dataDir}/habits.json`;
  let data = JSON.parse(await readFile(file, 'utf8'));
  if (data.schemaVersion === 1) {
    data = { schemaVersion: 2, records: data.records.map(({ completions, ...habit }) => ({ ...habit, doneDates: completions })) };
    await writeFile(`${file}.tmp`, JSON.stringify(data));
    await rename(`${file}.tmp`, file);
  }
  return serve({
    '/readyz': () => ({ status: 'ready', version }),
    '/habits': () => data.records,
    '/habits/streaks': (url) => {
      const habit = data.records.find((h) => h.id === url.searchParams.get('id'));
      const last = habit.doneDates.at(-1);
      return { id: habit.id, streak: habit.doneDates.length, lastDay: last.slice(0, 10) };
    },
  }, { log });
}
