import { habits } from './domain/fixtures.ts';
import { summarizeHabit, validateHabit } from './domain/habits.ts';
import { webRow } from './web/row.ts';
import { nativeRow } from './native/row.ts';

const day = '2026-03-01';

for (const habit of habits) {
  const summary = summarizeHabit(habit, day); // one call, two clients
  console.log(webRow(summary));
  console.log(nativeRow(summary));
}

console.log(validateHabit({ name: '   ', frequency: 'hourly' }));
