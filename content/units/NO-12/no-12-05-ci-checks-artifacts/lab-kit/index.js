// Runs create-lab.mjs here (it writes ./no12-lab), then starts the generated planner service on
// loopback with a data folder of its own and asks it for the tasks — a quick proof that the kit works.
// lint, typecheck and the CI script need npm packages, so they run only in your terminal.
// Node 22.13–22.17 import .ts files only with a flag, so this demo strips the types itself, the way
// the kit's scripts/build.mjs does, into ./lab-js and imports the JavaScript from there.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

await import('./create-lab.mjs');
await mkdir('lab-js', { recursive: true });
for (const name of await readdir('no12-lab/src')) {
  const code = stripTypeScriptTypes(await readFile(`no12-lab/src/${name}`, 'utf8')).replace(/(from\s+'\.\/[\w-]+)\.ts'/g, "$1.js'");
  await writeFile(`lab-js/${name.replace(/\.ts$/, '.js')}`, code);
}
const { openStore } = await import('./lab-js/store.js');
const { createApp } = await import('./lab-js/app.js');

const server = createApp(await openStore(`${process.cwd()}/lab-data`));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/tasks`, { signal: AbortSignal.timeout(2000) });
  const tasks = await response.json();
  console.log(`GET /tasks → ${response.status}: ${tasks.map((task) => `${task.id} ${task.priority}`).join(', ')}`);
} finally {
  server.closeAllConnections();
  server.close();
}
