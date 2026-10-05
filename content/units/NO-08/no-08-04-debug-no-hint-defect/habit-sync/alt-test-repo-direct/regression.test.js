import { test, expect } from './testing.js';
import { freshStore } from './lab.js';
import { openRepository } from './repo.js';

test('updates at the same time are all on disk', async () => {
  const file = await freshStore('regression-direct');
  const repo = await openRepository(file);
  await Promise.all([repo.update('h-03', { active: false }), repo.update('h-04', { name: '%%newName%%' }), repo.update('h-06', { active: false })]);
  const reopened = (await openRepository(file)).list();
  expect(reopened.filter((habit) => habit.id === 'h-03' || habit.id === 'h-06').map((habit) => habit.active), 'h-03 and h-06 paused').toEqual([false, false]);
  expect(reopened.find((habit) => habit.id === 'h-04').name, 'name of h-04').toBe('%%newName%%');
});
