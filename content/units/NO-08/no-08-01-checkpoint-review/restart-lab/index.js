// create → restart → reload, for real: a server over a JSON file, a client adapter, and a
// restart = stop the server and start a new one with a NEW repository object over the same file.
// (A real restart keeps its port; here every start takes a free port, port 0.)
import { writeFile } from 'node:fs/promises';
import { createClient } from './client.js';
import { openRepository } from './repo.js';
import { createServer } from './server.js';

const FILE = 'tasks.json';
const fixtures = [
  { id: 't-01', title: '%%water%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: '%%wardrobe%%', dueDate: '2026-03-05', done: true, priority: 'low' },
];
await writeFile(FILE, JSON.stringify({ schemaVersion: 1, records: fixtures }));

async function start() {
  const server = createServer(openRepository(FILE));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
async function stop(server) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
const show = (client) =>
  `%%clientShows%% ${client.tasks.length}; %%notSaved%% ${client.tasks.filter((task) => !task.saved).length}`;

let { server, base } = await start();
const page = createClient(base);
await page.load();
await page.create('%%rent%%');
console.log(`1. ${show(page)}`);

await stop(server);
console.log('— %%stopped%% —');
await page.create('%%keys%%');
console.log(`2. ${show(page)}`);

({ server, base } = await start());
console.log('— %%started%% —');
const reloaded = createClient(base); // a reload: a new page, an empty cache
await reloaded.load();
console.log(`3. ${show(reloaded)}`);
await stop(server);
