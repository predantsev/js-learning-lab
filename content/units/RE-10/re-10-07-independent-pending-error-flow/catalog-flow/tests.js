import { version } from 'react';
import { history } from './history';
import { loadControl } from './slowImport';
import { catalog } from './catalog';
import { versionNotes } from './versions';

// checkVisibility() also sees a display: none on a parent: Suspense hides content that way.
const shown = (el) => el !== null && el !== undefined && el.checkVisibility();
const field = () => screen.byLabel(L.search);
const results = () => screen.$(`section[aria-label="${L.results}"]`);
const details = () => screen.$(`section[aria-label="${L.details}"]`);
const foundText = () => results()?.querySelector('p')?.textContent ?? '(no results section)';
const foundFor = (query) => `${L.found}: ${catalog.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).length}`;
const visibleAlert = () => screen.allByRole('alert').find(shown) ?? null;
const visibleStatus = () => screen.allByRole('status').find(shown) ?? null;
const layoutVisible = () => shown(screen.$('#root h1')) && shown(screen.$('#root nav'));
function seenOpacity(el) {
  let value = 1;
  for (let node = el; node && node !== document.body; node = node.parentElement) value *= Number(getComputedStyle(node).opacity);
  return value;
}
async function openCatalog() {
  history.push('/items');
  await waitFor(() => shown(field()) && seenOpacity(results()) === 1, { timeout: 3000 });
}
// c-7 is the 7th gift idea: the same name as c-1 with its own number, priced 80.
const ITEM = catalog[6];

test('the app starts and shows the catalog', () => {
  expect(screen.$('#root h1'), 'the page heading').toHaveTextContent(L.catalogTitle);
  expect(foundText(), 'the results line').toBe(foundFor(''));
});

test('every typed letter shows in the search field at once', async () => {
  await openCatalog();
  const input = field();
  await user.clear(input);
  let typed = '';
  for (const ch of L.query) {
    await user.type(input, ch);
    typed += ch;
    expect(input, `the field right after typing "${ch}"`).toHaveValue(typed);
    await sleep(30);
  }
  await waitFor(() => foundText() === foundFor(L.query) && seenOpacity(results()) === 1, { timeout: 3000 });
});

test('right after a keystroke the old results stay on screen, dimmed', async () => {
  await openCatalog();
  const input = field();
  await user.clear(input);
  await waitFor(() => foundText() === foundFor('') && seenOpacity(results()) === 1, { timeout: 3000 });
  await user.type(input, L.query[0]);
  expect(foundText(), 'the results right after one keystroke').toBe(foundFor(''));
  expect(seenOpacity(results()), 'the opacity of the results while the new list is prepared').toBeLessThan(1);
});

test('when typing stops, the matching results show without dimming', async () => {
  await openCatalog();
  const input = field();
  await user.clear(input);
  for (const ch of L.query) await user.type(input, ch);
  await waitFor(() => foundText() === foundFor(L.query) && seenOpacity(results()) === 1, { timeout: 3000 });
  expect(input, 'the field').toHaveValue(L.query);
});

test('a failed load of the details code shows an alert with a retry button, and the layout stays', async () => {
  loadControl.failuresLeft = 1;
  history.push(`/items/${ITEM.id}`);
  await waitFor(() => visibleAlert() !== null, { timeout: 2000 });
  loadControl.failuresLeft = 0;
  expect(visibleAlert(), 'the alert').toHaveTextContent(L.loadFailed);
  expect(layoutVisible(), 'the heading and the menu are visible').toBe(true);
});

test('retrying loads the details, showing a status in the page area meanwhile', async () => {
  loadControl.failuresLeft = 0;
  const retry = screen.allByRole('button').find((b) => b.textContent === L.tryAgain && shown(b));
  expect(retry, `a visible button "${L.tryAgain}"`).toBeDefined();
  await user.click(retry);
  const status = visibleStatus();
  expect(status, 'a visible element with role="status" right after the retry').not.toBeNull();
  expect(status.textContent.trim(), 'text of the status').toBe(L.loadingDetails);
  expect(layoutVisible(), 'the heading and the menu are visible while loading').toBe(true);
  await waitFor(() => shown(details()), { timeout: 2000 });
  expect(details(), 'the details section').toHaveTextContent(ITEM.name);
});

test('the details show the price with the currency', async () => {
  if (!shown(details())) {
    history.push(`/items/${ITEM.id}`);
    await waitFor(() => shown(details()), { timeout: 2000 });
  }
  expect(details(), 'the details section').toHaveTextContent(`${L.price}: ${ITEM.price} ${L.currency}`);
});

test('versionNotes give the first React version of every API used, and the running React meets them', () => {
  const firstVersion = { lazy: '16.6', Suspense: '16.6', useTransition: '18.0', createRoot: '18.0', useDeferredValue: '18.0', startTransition: '18.0', useOptimistic: '19.0', useActionState: '19.0', use: '19.0' };
  for (const api of ['lazy', 'Suspense', 'createRoot']) {
    expect(versionNotes, 'versionNotes').toHaveProperty(api);
  }
  const transitionApis = ['useTransition', 'startTransition', 'useDeferredValue'].filter((api) => api in versionNotes);
  expect(transitionApis.length, 'versionNotes entries for useTransition, startTransition or useDeferredValue').toBeGreaterThan(0);
  const majorMinor = (text) => String(text).split('.').slice(0, 2).map(Number);
  const [major, minor] = majorMinor(version);
  for (const [api, noted] of Object.entries(versionNotes)) {
    if (api in firstVersion) expect(String(noted).split('.').slice(0, 2).join('.'), `versionNotes.${api}`).toBe(firstVersion[api]);
    const [needMajor, needMinor] = majorMinor(noted);
    expect(major > needMajor || (major === needMajor && minor >= needMinor), `the running React ${version} meets versionNotes.${api} = ${noted}`).toBe(true);
  }
});
