// Your regression test: it must fail on the version as reported (seeded/) and pass on your fix.
// Register tests with test(name, fn) from ./testing.js. Helpers: freshClub(name) in ./club-data.js,
// serve(server) in ./lab.js, openClub(file) in ./repo.js, createApp(club) in ./app.js.
import { test, expect } from './testing.js';
import { createApp } from './app.js';
import { freshClub } from './club-data.js';
import { serve } from './lab.js';
import { openClub } from './repo.js';

// The defect needs a member with two votes who logs pages: one reading × two votes = two rows.
test('pages of a member with two votes are counted once after a restart', async () => {
  const file = freshClub('regression');
  let club = openClub(file);
  let server = await serve(createApp(club));
  const posted = await fetch(`${server.base}/reads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ memberId: 'm-03', bookId: 'b-02', pages: 30 }),
  });
  await server.close();
  club.close();
  expect(posted.status, 'status of POST /reads').toBe(201);

  club = openClub(file);
  server = await serve(createApp(club));
  const summary = await (await fetch(`${server.base}/summary`)).json();
  await server.close();
  club.close();
  const olya = summary.find((member) => member.id === 'm-03');
  expect([olya.pagesRead, olya.votes], 'pages and votes of m-03 after the restart').toEqual([60, 2]);
});
