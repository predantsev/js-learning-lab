// A short session with the repository: three expenses, one removal, the list and the totals.
import { mkdir, writeFile } from 'node:fs/promises';
import { createFileRepository } from './repository.js';

await mkdir('data', { recursive: true });
await writeFile('data/categories.json', JSON.stringify([
  { id: 'food', label: '%%food%%' },
  { id: 'transport', label: '%%transport%%' },
  { id: 'fun', label: '%%fun%%' },
]));

const repo = createFileRepository('data', { maxBytes: 64 * 1024 });
await repo.recover();
await repo.save({ id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' });
await repo.save({ id: 'e-02', label: '%%pass%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' });
await repo.save({ id: 'e-06', label: '%%lunch%%', amountMinor: 21050, date: '2026-03-02', category: 'food' });
console.log('remove e-02:', await repo.remove('e-02'));

for (const expense of await repo.list()) console.log(`${expense.id} ${expense.label} ${expense.amountMinor}`);
for (const [id, { label, totalMinor }] of Object.entries(await repo.summary())) {
  console.log(`${id} (${label}): ${(totalMinor / 100).toFixed(2)}`);
}
