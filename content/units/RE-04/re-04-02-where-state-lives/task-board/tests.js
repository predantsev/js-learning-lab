import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { renderCounts } from './renders.js';

// Every check mounts its own copy of the app.
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('ul') !== null);
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const taskButton = (host, title) => [...host.querySelectorAll('li button')].find((b) => b.textContent.trim() === title);
const shownTitles = (host) => [...host.querySelectorAll('li button')].map((b) => b.textContent.trim());
const counts = () => ({ ...renderCounts });
const delta = (before, name) => (renderCounts[name] ?? 0) - (before[name] ?? 0);

test('expanding a task shows its due date, and a second click hides it', async () => {
  const copy = await mount();
  try {
    await user.click(taskButton(copy.host, L.library));
    expect(taskButton(copy.host, L.library), 'the expanded task button').toHaveAttribute('aria-expanded', 'true');
    expect(taskButton(copy.host, L.library).closest('li'), 'the expanded task').toHaveTextContent('2026-03-01');
    await user.click(taskButton(copy.host, L.library));
    expect(taskButton(copy.host, L.library), 'the task button after the second click').toHaveAttribute('aria-expanded', 'false');
    expect(taskButton(copy.host, L.library).closest('li'), 'the task after the second click').not.toHaveTextContent('2026-03-01');
  } finally { copy.finish(); }
});

test('the search and the done filter still narrow the list', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('input[type="search"]'), L.searchProbe);
    expect(shownTitles(copy.host), 'tasks shown after searching').toEqual([L.library]);
    await user.clear(copy.host.querySelector('input[type="search"]'));
    const showDone = [...copy.host.querySelectorAll('input[type="checkbox"]')].find((box) => !box.closest('li'));
    await user.click(showDone);
    expect(shownTitles(copy.host), 'tasks shown with done tasks hidden').toEqual([L.plants, L.library, L.grandma]);
  } finally { copy.finish(); }
});

test('ticking a task updates the open count', async () => {
  const copy = await mount();
  try {
    expect(copy.host.querySelector('main > p'), 'open count at the start').toHaveTextContent('3');
    await user.click(copy.host.querySelector('li input[type="checkbox"]'));
    expect(copy.host.querySelector('main > p'), 'open count after ticking the first task').toHaveTextContent('2');
  } finally { copy.finish(); }
});

test('the note keeps what is typed', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('textarea'), L.noteText);
    expect(copy.host.querySelector('textarea'), 'the note field').toHaveValue(L.noteText);
  } finally { copy.finish(); }
});

test('typing a note re-renders only NotePad', async () => {
  const copy = await mount();
  try {
    const before = counts();
    await user.type(copy.host.querySelector('textarea'), 'abc');
    expect(delta(before, 'NotePad'), 'NotePad renders while typing 3 letters').toBeGreaterThan(0);
    for (const name of ['App', 'Toolbar', 'TaskList', 'Summary']) expect(delta(before, name), `${name} renders while typing a note`).toBe(0);
  } finally { copy.finish(); }
});

// A row component that keeps its own expanded flag is even lower and also fine, so only the
// components outside the list are counted here; the first check proves that expanding works.
test('expanding a task re-renders nothing outside the list', async () => {
  const copy = await mount();
  try {
    const before = counts();
    await user.click(taskButton(copy.host, L.plants));
    expect(taskButton(copy.host, L.plants), 'the expanded task button').toHaveAttribute('aria-expanded', 'true');
    for (const name of ['App', 'Toolbar', 'Summary', 'NotePad']) expect(delta(before, name), `${name} renders after expanding a task`).toBe(0);
  } finally { copy.finish(); }
});
