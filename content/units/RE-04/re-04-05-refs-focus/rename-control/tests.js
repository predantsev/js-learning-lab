import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Every check mounts its own copy and records errors React reports.
async function mount() {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  root.render(createElement(App));
  await waitFor(() => host.querySelector('li') !== null);
  await settle();
  return { host, errors, finish: () => { root.unmount(); host.remove(); } };
}
const row = (host, index) => host.querySelectorAll('li')[index];
const button = (scope, text) => [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
const active = () => document.activeElement;

test('nothing is focused on first display', async () => {
  document.activeElement?.blur?.();
  const copy = await mount();
  try {
    expect(copy.host.contains(active()), 'focus inside the list right after mounting').toBe(false);
  } finally { copy.finish(); }
});

test('opening the editor focuses the name field', async () => {
  const copy = await mount();
  try {
    await user.click(button(row(copy.host, 1), L.rename));
    expect(copy.errors, 'errors React reported').toEqual([]);
    const input = row(copy.host, 1).querySelector('input');
    expect(input, 'the name field of the second wish').toBeDefined();
    expect(input, 'the name field of the second wish').toHaveFocus();
    expect(input, 'the name field of the second wish').toHaveValue(L.lamp);
  } finally { copy.finish(); }
});

test('cancel returns focus to the Rename button of that row', async () => {
  const copy = await mount();
  try {
    await user.click(button(row(copy.host, 1), L.rename));
    await user.click(button(row(copy.host, 1), L.cancel));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(button(row(copy.host, 1), L.rename), 'the Rename button of the second wish').toHaveFocus();
  } finally { copy.finish(); }
});

test('saving renames the wish and returns focus to its Rename button', async () => {
  const copy = await mount();
  try {
    await user.click(button(row(copy.host, 2), L.rename));
    await user.fill(row(copy.host, 2).querySelector('input'), L.newTickets);
    await user.submit(row(copy.host, 2).querySelector('form'));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(row(copy.host, 2).querySelector('span'), 'the third wish after saving').toHaveTextContent(L.newTickets);
    expect(button(row(copy.host, 2), L.rename), 'the Rename button of the third wish').toHaveFocus();
  } finally { copy.finish(); }
});
