import { loadedModules } from './loadLog';

// checkVisibility() also sees a display: none on a parent: Suspense hides content that way.
const shown = (el) => el !== null && el !== undefined && el.checkVisibility();
const toggle = () => screen.allByRole('button').find((b) => b.textContent === L.showTotals || b.textContent === L.hideTotals);
const status = () => screen.allByRole('status').find(shown) ?? null;
const totals = () => screen.$(`section[aria-label="${L.totalsTitle}"]`);

async function showTotals() {
  const button = toggle();
  expect(button, `a button "${L.showTotals}"`).toBeDefined();
  if (button.textContent === L.showTotals) await user.click(button);
}

test('the totals code is not loaded before the totals are shown', () => {
  expect(loadedModules, 'modules loaded before the first click').toEqual([]);
});

test('while the totals load, a status message shows in the totals area only', async () => {
  await showTotals();
  const message = status();
  expect(message, 'a visible element with role="status"').not.toBeNull();
  expect(message.textContent.trim(), 'text of the status message').toBe(L.loadingTotals);
  expect(shown(screen.$('#root h1')), 'the heading stays visible').toBe(true);
  expect(shown(screen.$('#root ul')), 'the expense list stays visible').toBe(true);
  expect(shown(toggle()), 'the button stays visible').toBe(true);
});

test('the category totals appear once their code has loaded', async () => {
  await showTotals();
  await waitFor(() => shown(totals()), { timeout: 2000 });
  expect(totals(), 'the totals section').toHaveTextContent(`${L.food}: 1056.00`);
  expect(status(), 'a visible status message after loading').toBeNull();
});

test('showing the totals a second time needs no new load', async () => {
  await showTotals();
  await waitFor(() => shown(totals()), { timeout: 2000 });
  await user.click(toggle());
  await user.click(toggle());
  expect(status(), 'a visible status message on the second showing').toBeNull();
  expect(shown(totals()), 'the totals are visible at once').toBe(true);
});
