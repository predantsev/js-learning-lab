// Run here: the same server code and the same client script, in one process on a free port.
// (The platform cannot keep a server running in the background; your terminal can.)
import { createApp } from './app.js';
import { freshStore, serve } from './lab.js';
import { edit, show } from './lab-client.mjs';
import { openRepository } from './repo.js';

const file = await freshStore('habits-lab');
const log = (line) => console.log(`server: ${line}`);
let server = await serve(createApp(await openRepository(file), log));
console.log(`$ node lab-client.mjs edit\n${await edit(server.base)}\n${await show(server.base)}`);
await server.close();
console.log('— restart —');
server = await serve(createApp(await openRepository(file), log));
console.log(`$ node lab-client.mjs show\n${await show(server.base)}`);
await server.close();
