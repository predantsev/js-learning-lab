// Your regression test: it must fail on the version as reported (seeded/) and pass on your fix.
import { test, expect } from './testing.js';
import { createApp } from './app.js';
import { freshClub } from './club-data.js';
import { serve } from './lab.js';
import { openClub } from './repo.js';

// Checks the summary of the fixtures only — nobody logs anything.
test('the summary shows the fixtures', async () => {
  const club = openClub(freshClub('regression'));
  const server = await serve(createApp(club));
  const summary = await (await fetch(`${server.base}/summary`)).json();
  await server.close();
  club.close();
  expect(summary.map((m) => m.pagesRead), 'pagesRead of every member').toEqual([40, 55, 0, 12, 0]);
});
