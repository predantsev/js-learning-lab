import { shownSearches } from './analytics';
import { wishes } from './wishes';

const field = () => screen.byLabel(L.searchLabel);
const checkbox = () => screen.byRole('checkbox');
const foundText = () => screen.$(`section[aria-label="${L.results}"] p`)?.textContent ?? '(no results section)';
const foundFor = (query, onlyWanted) =>
  `${L.found}: ${wishes.filter((w) => w.name.toLowerCase().includes(query.toLowerCase()) && (!onlyWanted || !w.acquired)).length}`;

test('the first display records the empty search once', () => {
  expect(shownSearches, 'recorded searches after the first display').toEqual(['']);
});

test('fast typing records only the search that reached the screen', async () => {
  const input = field();
  for (const ch of L.query) {
    await user.type(input, ch);
    await sleep(30);
  }
  await waitFor(() => foundText() === foundFor(L.query, false), { timeout: 3000 });
  await sleep(50);
  expect(shownSearches, 'recorded searches after typing three letters fast').toEqual(['', L.query]);
});

test('changing the filter with the same search records nothing new', async () => {
  const before = [...shownSearches];
  await user.click(checkbox());
  await waitFor(() => foundText() === foundFor(L.query, true), { timeout: 3000 });
  await sleep(50);
  expect(shownSearches, 'recorded searches after ticking the checkbox').toEqual(before);
});
