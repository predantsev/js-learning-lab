import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Every check mounts its own copy of the board, so one crash does not hide the other checks.
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const errors = [];
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  root.render(createElement(App));
  await waitFor(() => host.childElementCount > 0);
  mounted.push(() => { root.unmount(); host.remove(); });
  return { host, errors };
}
// Removes the copies a check mounted, whatever happened in the check.
const mounted = [];
async function check(body) {
  try { await body(); } finally { while (mounted.length > 0) mounted.pop()(); }
}
const names = (host) => [...host.querySelectorAll('li')].map((li) => li.querySelector('button').textContent.trim());
const rowOf = (host, name) => [...host.querySelectorAll('li')].find((li) => li.querySelector('button').textContent.trim() === name);
const buttonByText = (host, text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text);

test('the board shows the active habits', () => check(async () => {
  const { host, errors } = await mount();
  expect(errors, 'errors React reported').toEqual([]);
  expect(names(host), 'habit names in the list').toEqual([L.exercise, L.reading, L.water]);
}));

test('each habit opens its own details', () => check(async () => {
  const { host, errors } = await mount();
  await user.click(rowOf(host, L.reading).querySelector('button'));
  expect(errors, 'errors React reported').toEqual([]);
  expect(rowOf(host, L.reading), 'row of the opened habit').toHaveTextContent(`${L.doneTimes} 3`);
  expect(rowOf(host, L.exercise).textContent, 'row of a habit that was not opened').not.toContain(L.doneTimes);
}));

test('removing a habit keeps the board working', () => check(async () => {
  const { host, errors } = await mount();
  const removeButton = [...rowOf(host, L.exercise).querySelectorAll('button')].find((b) => b.textContent.trim() === L.remove);
  await user.click(removeButton);
  expect(errors, 'errors React reported').toEqual([]);
  expect(names(host), 'habit names after removing one').toEqual([L.reading, L.water]);
}));

test('the filter switches between active and paused habits', () => check(async () => {
  const { host, errors } = await mount();
  await user.click(buttonByText(host, L.showPaused));
  expect(errors, 'errors React reported').toEqual([]);
  expect(names(host), 'names after switching to paused habits').toEqual([L.words]);
  await user.click(buttonByText(host, L.showActive));
  expect(errors, 'errors React reported').toEqual([]);
  expect(names(host), 'names after switching back').toEqual([L.exercise, L.reading, L.water]);
}));

test('clearing every habit shows the empty message', () => check(async () => {
  const { host, errors } = await mount();
  await user.click(buttonByText(host, L.clearAll));
  expect(errors, 'errors React reported').toEqual([]);
  expect(host, 'the board after clearing').toHaveTextContent(L.empty);
}));
