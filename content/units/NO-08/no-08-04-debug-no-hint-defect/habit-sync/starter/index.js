// The report, replayed: two quick edits from the page, a server restart, a reload.
// Then your regression test runs.
import { createApp } from './app.js';
import { createClient } from './client.js';
import { freshStore, serve } from './lab.js';
import { openRepository } from './repo.js';
import { run } from './testing.js';

const file = await freshStore('demo');
const show = (habits) => {
  const h01 = habits.find((habit) => habit.id === 'h-01');
  const h02 = habits.find((habit) => habit.id === 'h-02');
  return `h-01 "${h01.name}", h-02 active: ${h02.active}`;
};

let server = await serve(createApp(await openRepository(file), (line) => console.log(`server: ${line}`)));
const page = createClient(server.base);
await page.load();
await Promise.all([page.rename('h-01', '%%newName%%'), page.pause('h-02')]); // two quick edits
console.log(`%%beforeRestart%% ${show(page.habits)}`);
await server.close();

server = await serve(createApp(await openRepository(file), (line) => console.log(`server: ${line}`)));
const reloaded = createClient(server.base);
await reloaded.load();
console.log(`%%afterRestart%% ${show(reloaded.habits)}`);
await server.close();

console.log('— regression.test.js —');
await import('./regression.test.js');
await run();
