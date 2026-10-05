import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { habitsReducer } from './habitsReducer';
import { START_HABITS } from './habits';

// A fresh copy of the starting list on every call; frozen() also freezes it, so any change throws.
const fresh = () => START_HABITS.map((habit) => ({ ...habit, completions: [...habit.completions] }));
function frozen() {
  const list = fresh();
  for (const habit of list) { Object.freeze(habit.completions); Object.freeze(habit); }
  return Object.freeze(list);
}
const walk = { id: 'h-09', name: L.walk, frequency: 'daily', active: true, completions: [] };
const call = (habits, action) => {
  expect(typeof habitsReducer, 'type of habitsReducer').toBe('function');
  return habitsReducer(habits, action);
};

test('added puts the new habit at the end', () => {
  const next = call(frozen(), { type: 'added', habit: walk });
  expect(next.map((h) => h.id), 'ids after adding h-09').toEqual(['h-01', 'h-02', 'h-04', 'h-05', 'h-09']);
  expect(next[4], 'the added habit').toEqual(walk);
});

test('updated renames only that habit and keeps its other fields', () => {
  const next = call(frozen(), { type: 'updated', id: 'h-02', name: L.walk });
  expect(next.map((h) => h.name), 'names after renaming h-02').toEqual([L.exercise, L.walk, L.tidy, L.words]);
  expect(next[1], 'the renamed habit').toEqual({ ...fresh()[1], name: L.walk });
});

test('removed drops only that habit', () => {
  const next = call(frozen(), { type: 'removed', id: 'h-04' });
  expect(next.map((h) => h.id), 'ids after removing h-04').toEqual(['h-01', 'h-02', 'h-05']);
});

test('activeToggled flips active of that habit only', () => {
  const next = call(frozen(), { type: 'activeToggled', id: 'h-05' });
  expect(next.map((h) => h.active), 'active flags after toggling h-05').toEqual([true, true, true, true]);
  const back = call(next, { type: 'activeToggled', id: 'h-01' });
  expect(back.map((h) => h.active), 'active flags after toggling h-01 too').toEqual([false, true, true, true]);
});

test('every action returns a new list and leaves the old one unchanged', () => {
  const actions = [
    { type: 'added', habit: walk },
    { type: 'updated', id: 'h-01', name: L.walk },
    { type: 'removed', id: 'h-01' },
    { type: 'activeToggled', id: 'h-01' },
  ];
  for (const action of actions) {
    const before = fresh();
    const snapshot = JSON.stringify(before);
    const next = call(before, action);
    expect(next === before, `${action.type}: the same array came back`).toBe(false);
    expect(JSON.stringify(before), `${action.type}: the list that was passed in`).toBe(snapshot);
  }
});

test('the page adds, toggles, renames and removes through the reducer', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  try {
    await waitFor(() => host.querySelector('li') !== null);
    const names = () => [...host.querySelectorAll('li span')].map((s) => s.textContent.trim());
    await user.fill(host.querySelector('[data-form="add"] input'), L.walk);
    await user.submit(host.querySelector('[data-form="add"]'));
    expect(names(), 'names after adding on the page').toEqual([L.exercise, L.reading, L.tidy, L.words, L.walk]);
    await user.click(host.querySelectorAll('li input[type="checkbox"]')[3]);
    expect(host.querySelectorAll('li input[type="checkbox"]')[3], 'the fourth checkbox after a click').toBeChecked();
    await user.select(host.querySelector('[data-form="rename"] select'), 'h-02');
    await user.fill(host.querySelector('[data-form="rename"] input'), L.stretch);
    await user.submit(host.querySelector('[data-form="rename"]'));
    expect(names(), 'names after renaming the second habit').toEqual([L.exercise, L.stretch, L.tidy, L.words, L.walk]);
    await user.click(host.querySelectorAll('li button')[0]);
    expect(names(), 'names after removing the first habit').toEqual([L.stretch, L.tidy, L.words, L.walk]);
  } finally { root.unmount(); host.remove(); }
});
