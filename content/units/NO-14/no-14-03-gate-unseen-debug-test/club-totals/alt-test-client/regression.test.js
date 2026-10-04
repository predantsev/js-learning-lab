// Your regression test: it must fail on the version as reported (seeded/) and pass on your fix.
// Register tests with test(name, fn) from ./testing.js. Helpers: freshClub(name) in ./club-data.js,
// serve(server) in ./lab.js, openClub(file) in ./repo.js, createApp(club) in ./app.js.
import { test, expect } from './testing.js';
import { createApp } from './app.js';
import { createClient } from './client.js';
import { freshClub } from './club-data.js';
import { serve } from './lab.js';
import { openClub } from './repo.js';

// The complaint as a test: what the page shows after logging must match a page loaded anew.
test('the page after logging matches a freshly loaded page', async () => {
  const club = openClub(freshClub('page-check'));
  const server = await serve(createApp(club));
  try {
    const page = createClient(server.base);
    await page.load();
    await page.logPages('m-03', 'b-02', 30);
    const reloaded = createClient(server.base);
    await reloaded.load();
    expect(reloaded.members, 'the reloaded page').toEqual(page.members);
  } finally {
    await server.close();
    club.close();
  }
});
