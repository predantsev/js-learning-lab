// The report, replayed: Olya logs 30 pages; the page shows them; the page is reloaded the next
// morning, after a server restart. Then your regression test runs.
import { createApp } from './app.js';
import { createClient } from './client.js';
import { freshClub } from './club-data.js';
import { serve } from './lab.js';
import { openClub } from './repo.js';
import { run } from './testing.js';

const file = freshClub('demo');
const line = (members, id) => {
  const member = members.find((m) => m.id === id);
  return `${member.name} — %%pages%%: ${member.pagesRead}, %%votes%%: ${member.votes}`;
};

let club = openClub(file);
let server = await serve(createApp(club));
const page = createClient(server.base);
await page.load();
console.log(`%%atStart%% ${line(page.members, 'm-03')}`);
await page.logPages('m-03', 'b-02', 30);
console.log(`%%onPage%% ${line(page.members, 'm-03')}`);
await server.close();
club.close();

club = openClub(file); // the next morning: the server starts again over the same file
server = await serve(createApp(club));
const reloaded = createClient(server.base);
await reloaded.load();
console.log(`%%afterReload%% ${line(reloaded.members, 'm-03')}`);
await server.close();
club.close();

console.log('— regression.test.js —');
await import('./regression.test.js');
await run();
