// What the local task does, in one process: the server over club.db, "log" from the page, a restart
// (a new connection to the same file) and "show". Your terminal does it with two windows.
import { createApp } from './app.js';
import { freshClub } from './club-data.js';
import { serve } from './lab.js';
import { openClub } from './repo.js';

const line = (m) => `${m.name} — %%pages%%: ${m.pagesRead}, %%votes%%: ${m.votes}`;
const file = freshClub('club');

let club = openClub(file);
let server = await serve(createApp(club));
const before = (await (await fetch(`${server.base}/summary`)).json()).find((m) => m.id === 'm-03');
const response = await fetch(`${server.base}/reads`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ memberId: 'm-03', bookId: 'b-02', pages: 30 }),
});
console.log(`POST /reads → ${response.status}`);
console.log(`%%onPage%% ${line({ ...before, pagesRead: before.pagesRead + 30 })}`);
await server.close();
club.close();

club = openClub(file);
server = await serve(createApp(club));
const after = (await (await fetch(`${server.base}/summary`)).json()).find((m) => m.id === 'm-03');
console.log(`%%fromServer%% ${line(after)}`);
await server.close();
club.close();
