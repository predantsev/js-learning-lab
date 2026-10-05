// Three checks from the three focused labs, on data none of the labs used.
import { openHabitDb, doneSince } from './sql-check.js';
import { createWishlistServer, IDLE_MS } from './auth-check.js';
import { serverRender, clientRender } from './ssr-check.js';

// 1. SQL: check-ins since 1 May, every habit counted.
const db = openHabitDb();
console.log('SQL:', JSON.stringify(doneSince(db, '2026-05-01')));
db.close();

// 2. Auth: an own wishlist, someone else's, and the own one again after 30 idle minutes + 1 ms.
const clock = { time: 0, now() { return this.time; } };
const sessions = new Map([['s-7f2c', { userId: 'u-21', lastSeenAt: 0 }]]);
const wishlists = [{ id: 'l-1', ownerId: 'u-21', name: `%%birthday%%` }, { id: 'l-2', ownerId: 'u-22', name: `%%newHome%%` }];
const server = createWishlistServer({ clock, sessions, wishlists });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const get = async (path) => (await fetch(base + path, { headers: { cookie: 'sid=s-7f2c' }, signal: AbortSignal.timeout(2000) })).status;
try {
  const own = await get('/wishlists/l-1');
  const foreign = await get('/wishlists/l-2');
  clock.time += IDLE_MS + 1;
  const idle = await get('/wishlists/l-1');
  console.log(`auth: %%own%% ${own} · %%foreign%% ${foreign} · %%afterIdle%% ${idle}`);
} finally {
  server.closeAllConnections();
  server.close();
}

// 3. SSR: the server passes today's date in; the client renders from the page data.
const tasks = [
  { id: 't-21', title: `%%callPlumber%%`, dueDate: '2026-05-04', done: false },
  { id: 't-22', title: `%%buyTickets%%`, dueDate: '2026-05-05', done: false },
];
const sent = serverRender({ tasks, today: '2026-05-04' });
const fromPage = JSON.parse(sent.payload);
console.log(`SSR: %%markupMatch%%`, clientRender(fromPage) === sent.html);
