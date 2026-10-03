import { history } from './App';
import { tasks } from './tasks';

// checkVisibility() also sees a display: none on a parent: Suspense hides content that way.
const shown = (el) => el !== null && el !== undefined && el.checkVisibility();
const link = (text) => screen.allByRole('link').find((a) => a.textContent === text);
const visibleStatus = () => screen.allByRole('status').find(shown) ?? null;
const field = () => screen.byLabel(L.search);
const results = () => screen.$(`section[aria-label="${L.results}"]`);
const foundText = () => results()?.querySelector('p')?.textContent ?? '(no results section)';
const foundFor = (query) => `${L.found}: ${tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())).length}`;
function seenOpacity(el) {
  let value = 1;
  for (let node = el; node && node !== document.body; node = node.parentElement) value *= Number(getComputedStyle(node).opacity);
  return value;
}
async function openTasks() {
  if (history.getState().entries[history.getState().index] !== '/tasks') await user.click(link(L.allTasks));
  await waitFor(() => shown(field()), { timeout: 2000 });
}

test('opening "Due today" keeps the heading and the menu, with a status in the page area', async () => {
  await user.click(link(L.dueToday));
  const status = visibleStatus();
  expect(status, 'a visible element with role="status"').not.toBeNull();
  expect(status.textContent.trim(), 'text of the status').toBe(L.loadingPage);
  expect(shown(screen.$('#root h1')), 'the heading stays visible').toBe(true);
  expect(shown(screen.$('#root nav')), 'the menu stays visible').toBe(true);
});

test('the due-today overview appears once its code arrives', async () => {
  if (history.getState().entries[history.getState().index] !== '/today') await user.click(link(L.dueToday));
  await waitFor(() => shown(screen.$('#root h2')), { timeout: 2000 });
  expect(screen.$('#root h2'), 'the overview heading').toHaveTextContent(L.dueToday);
});

test('the open-task count says it is counting until the number arrives', async () => {
  if (history.getState().entries[history.getState().index] !== '/today') await user.click(link(L.dueToday));
  await waitFor(() => shown(screen.$('#root h2')), { timeout: 2000 });
  await user.click(link(L.allTasks));
  const status = visibleStatus();
  expect(status, 'a visible element with role="status" right after opening the list').not.toBeNull();
  expect(status.textContent.trim(), 'text of the status').toBe(L.counting);
  const open = tasks.filter((t) => !t.done).length;
  await waitFor(() => screen.$('#root').textContent.includes(`${L.openTasks}: ${open}`), { timeout: 2000 });
});

test('every typed letter shows in the search field at once', async () => {
  await openTasks();
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
  await openTasks();
  const input = field();
  await user.clear(input);
  await waitFor(() => foundText() === foundFor('') && seenOpacity(results()) === 1, { timeout: 3000 });
  await user.type(input, L.query[0]);
  expect(foundText(), 'the results right after one keystroke').toBe(foundFor(''));
  expect(seenOpacity(results()), 'the opacity of the results while the new list is prepared').toBeLessThan(1);
  await waitFor(() => foundText() === foundFor(L.query[0]) && seenOpacity(results()) === 1, { timeout: 3000 });
});
