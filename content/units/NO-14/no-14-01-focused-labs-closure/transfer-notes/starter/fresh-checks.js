// The three fresh checks of this exercise (read-only): the checks of the example, other inputs.
import { openHabitDb, doneSince } from './sql-check.js';
import { createWishlistServer, IDLE_MS } from './auth-check.js';
import { serverRender, clientRender } from './ssr-check.js';

// SQL: the `done` counts, in the order of the rows, for check-ins since 3 May.
export function runSqlCheck() {
  const db = openHabitDb();
  try {
    return doneSince(db, '2026-05-03').map((row) => row.done);
  } finally {
    db.close();
  }
}

// Auth: statuses of the own wishlist at the start, 29 minutes later and 29 minutes after that.
export async function runAuthCheck() {
  const clock = { time: 0, now() { return this.time; } };
  const sessions = new Map([['s-9a01', { userId: 'u-21', lastSeenAt: 0 }]]);
  const wishlists = [{ id: 'l-1', ownerId: 'u-21', name: 'l-1' }, { id: 'l-2', ownerId: 'u-22', name: 'l-2' }];
  const server = createWishlistServer({ clock, sessions, wishlists });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = async (path) => (await fetch(base + path, { headers: { cookie: 'sid=s-9a01' }, signal: AbortSignal.timeout(2000) })).status;
  try {
    const statuses = [await get('/wishlists/l-1')];
    clock.time += IDLE_MS - 60_000;
    statuses.push(await get('/wishlists/l-1'));
    clock.time += IDLE_MS - 60_000;
    statuses.push(await get('/wishlists/l-1'));
    return statuses;
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

// SSR: the server renders 4 May; this client takes "today" from its own clock, where it is already 5 May.
export function runSsrCheck() {
  const tasks = [
    { id: 't-31', title: 't-31', dueDate: '2026-05-04', done: false },
    { id: 't-32', title: 't-32', dueDate: '2026-05-05', done: false },
  ];
  const sent = serverRender({ tasks, today: '2026-05-04' });
  const fromPage = JSON.parse(sent.payload);
  return clientRender({ ...fromPage, today: '2026-05-05' }) === sent.html;
}
