import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { activeHabitsCalls } from './habits';
import { pickerRebuilds } from './PeriodPicker';

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
const noteField = (host) => host.querySelector('label input');
const names = (host) => [...host.querySelectorAll('li')].map((li) => li.firstChild.textContent.trim());

test('the board shows the active habits, their count and the most done one', async () => {
  const copy = await mount();
  try {
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(names(copy.host), 'names in the list').toEqual([L.exercise, L.reading, L.water, L.tidy, L.walk]);
    expect(copy.host, 'the board').toHaveTextContent(`${L.activeLabel} 5`);
    expect(copy.host, 'the board').toHaveTextContent(`${L.mostDone} ${L.exercise}`);
  } finally { copy.finish(); }
});

test('typing a note does not rebuild the period picker', async () => {
  const copy = await mount();
  try {
    const before = pickerRebuilds();
    await user.type(noteField(copy.host), 'ok');
    expect(pickerRebuilds() - before, 'picker rebuilds while typing two letters').toBe(0);
  } finally { copy.finish(); }
});

test('active habits are derived once per render', async () => {
  const copy = await mount();
  try {
    const before = activeHabitsCalls();
    await user.type(noteField(copy.host), 'a');
    expect(activeHabitsCalls() - before, 'calls of activeHabits for one letter').toBe(1);
  } finally { copy.finish(); }
});

test('pausing a habit updates the list and the count', async () => {
  const copy = await mount();
  try {
    const pauseReading = [...copy.host.querySelectorAll('li button')].find((b) => b.textContent.includes(L.reading));
    await user.click(pauseReading);
    expect(names(copy.host), 'names after pausing').toEqual([L.exercise, L.water, L.tidy, L.walk]);
    expect(copy.host, 'the board after pausing').toHaveTextContent(`${L.activeLabel} 4`);
  } finally { copy.finish(); }
});
