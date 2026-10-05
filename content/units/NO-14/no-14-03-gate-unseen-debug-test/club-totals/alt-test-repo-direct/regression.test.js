// Your regression test: it must fail on the version as reported (seeded/) and pass on your fix.
import { test, expect } from './testing.js';
import { freshClub } from './club-data.js';
import { openClub } from './repo.js';

// A test one level down: the repository alone, no HTTP. The query is where the totals are made.
test('summary counts every reading and every vote once', () => {
  const club = openClub(freshClub('regression-unit'));
  club.addRead({ memberId: 'm-03', bookId: 'b-02', pages: 30 });
  club.addRead({ memberId: 'm-01', bookId: 'b-03', pages: 10 });
  const byId = Object.fromEntries(club.summary().map((m) => [m.id, [m.pagesRead, m.votes]]));
  club.close();
  expect(byId['m-03'], 'm-03').toEqual([30, 2]);
  expect(byId['m-01'], 'm-01').toEqual([50, 1]);
});
