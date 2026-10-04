// Reads four habit files — good, missing, broken and a folder — and prints what readJsonFile says.
import { mkdir, writeFile } from 'node:fs/promises';
import { readJsonFile } from './app.js';

await mkdir('data/archive', { recursive: true });
await writeFile('data/habits.json', JSON.stringify([{ id: 'h-03', name: '%%habit3%%', completions: ['2026-03-01'] }]));
await writeFile('data/broken.json', '[{ "id": "h-04", ');

for (const file of ['data/habits.json', 'data/paused.json', 'data/broken.json', 'data/archive']) {
  try {
    const result = await readJsonFile(file);
    console.log(`${file}: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log(`${file}: ${error.message} (cause: ${error.cause?.code ?? error.cause?.name ?? '—'})`);
  }
}
