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
const control = (scope, text) => [...scope.querySelectorAll('button, [role="button"], span, div')].find((n) => n.textContent.trim() === text);
const active = () => document.activeElement;

test('nothing is focused on first display', async () => {
  document.activeElement?.blur?.();
  const copy = await mount();
  try {
    expect(copy.host.contains(active()), 'focus inside the list right after mounting').toBe(false);
  } finally { copy.finish(); }
});

test('Rename is a real button', async () => {
  const copy = await mount();
  try {
    const rename = control(row(copy.host, 0), L.rename);
    expect(rename?.tagName, 'the element that shows “Rename”').toBe('BUTTON');
  } finally { copy.finish(); }
});

test('Enter on Rename opens the editor with focus in the name field', async () => {
  const copy = await mount();
  try {
    const rename = control(row(copy.host, 1), L.rename);
    rename.focus();
    await user.press('Enter', rename);
    const input = row(copy.host, 1).querySelector('input');
    expect(input, 'the name field of the second habit after Enter').not.toBeNull();
    expect(input, 'the name field of the second habit').toHaveFocus();
    expect(input, 'the name field of the second habit').toHaveValue(L.reading);
  } finally { copy.finish(); }
});

test('Escape cancels without saving and returns focus to Rename', async () => {
  const copy = await mount();
  try {
    await user.click(control(row(copy.host, 1), L.rename));
    await user.fill(row(copy.host, 1).querySelector('input'), L.typed);
    await user.press('Escape', row(copy.host, 1).querySelector('input'));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(row(copy.host, 1).querySelector('input'), 'the name field after Escape').toBeNull();
    expect(row(copy.host, 1), 'the second habit after Escape').toHaveTextContent(L.reading);
    expect(control(row(copy.host, 1), L.rename), 'Rename of the second habit').toHaveFocus();
  } finally { copy.finish(); }
});

test('Enter in the field saves and returns focus to Rename', async () => {
  const copy = await mount();
  try {
    await user.click(control(row(copy.host, 2), L.rename));
    await user.fill(row(copy.host, 2).querySelector('input'), L.typed);
    await user.press('Enter', row(copy.host, 2).querySelector('input'));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(row(copy.host, 2), 'the third habit after Enter').toHaveTextContent(L.typed);
    expect(control(row(copy.host, 2), L.rename), 'Rename of the third habit').toHaveFocus();
  } finally { copy.finish(); }
});
