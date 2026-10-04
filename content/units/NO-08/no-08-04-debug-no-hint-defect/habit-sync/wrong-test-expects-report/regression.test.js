// Your regression test: it must fail on the version as reported (seeded/) and pass on your fix.
// Write it with test(name, fn) and expect(…) from ./testing.js; lab.js helps start a store and a server.
import { test, expect } from './testing.js';
import { createApp } from './app.js';
import { freshStore, serve } from './lab.js';
import { openRepository } from './repo.js';

const patch = (base, id, changes) =>
  fetch(`${base}/habits/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
    signal: AbortSignal.timeout(2000),
  });

test('two quick edits of two habits both survive a restart', async () => {
  const file = await freshStore('regression');
  const server = await serve(createApp(await openRepository(file)));
  await Promise.all([patch(server.base, 'h-01', { name: '%%newName%%' }), patch(server.base, 'h-02', { active: false })]);
  await server.close();
  const after = (await openRepository(file)).list();
  expect(after.find((habit) => habit.id === 'h-01').name, 'name of h-01 after the restart').toBe('%%newName%%');
  expect(after.find((habit) => habit.id === 'h-02').active, 'active of h-02 after the restart').toBe(true); // as the report saw it
});
