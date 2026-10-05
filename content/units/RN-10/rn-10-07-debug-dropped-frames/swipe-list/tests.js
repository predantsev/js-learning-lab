import { initialExpenses } from './main.jsx';
import { swipe } from './swipeSim.js';
import { totalsStats } from './totals.js';

const row = (id) => screen.$(`[data-testid="row-${id}"]`);
const isOpen = (id) => (row(id)?.getAttribute('aria-label') ?? '').endsWith(`, ${L.opened}`);
const thirtyUpdates = Array.from({ length: 30 }, (_, i) => -4 * (i + 1)); // ends at −120: opens the row

test('an opened row stays opened when a row above it is deleted', async () => {
  await waitFor(() => row('e-03'));
  expect(swipe('e-03', thirtyUpdates), 'a row showing e-03 to swipe').toBe(true);
  await waitFor(() => isOpen('e-03'));
  expect(swipe('e-01', [-100, -220]), 'a row showing e-01 to swipe').toBe(true);
  await waitFor(() => !row('e-01'));
  await settle();
  expect(isOpen('e-03'), 'e-03 is still opened after e-01 was deleted').toBe(true);
  expect(isOpen('e-04'), 'e-04 is opened after e-01 was deleted').toBe(false);
});

test('a swipe of 30 movement updates computes the totals at most once', async () => {
  await waitFor(() => row('e-05'));
  const before = totalsStats.calls;
  expect(swipe('e-05', thirtyUpdates.map((x) => x / 3)), 'a row showing e-05 to swipe').toBe(true); // ends at −40: closes
  await settle();
  expect(totalsStats.calls - before, 'categoryTotals calls during one swipe of 30 updates').toBeLessThanOrEqual(1);
});

test('the totals match the remaining expenses after a delete', async () => {
  await waitFor(() => row('e-06'));
  expect(swipe('e-06', [-150, -260]), 'a row showing e-06 to swipe').toBe(true);
  await waitFor(() => !row('e-06'));
  const left = initialExpenses.filter((e) => screen.$(`[data-testid="row-${e.id}"]`));
  const expected = {};
  for (const e of left) expected[e.category] = (expected[e.category] ?? 0) + e.amountMinor;
  const shown = screen.$('[data-testid="totals"]').textContent;
  for (const [category, minor] of Object.entries(expected)) {
    expect(shown, 'the totals line').toContain(`${category}: ${(minor / 100).toFixed(2)}`);
  }
});

test('every row is labelled with its own record', async () => {
  await waitFor(() => row('e-02'));
  for (const expense of initialExpenses) {
    if (!row(expense.id)) continue;
    expect(row(expense.id).getAttribute('aria-label'), `accessibility label of row ${expense.id}`).toMatch(new RegExp(`^${expense.label}, ${(expense.amountMinor / 100).toFixed(2)}`));
  }
});
