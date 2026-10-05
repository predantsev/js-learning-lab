import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { repairHabit, breakHabit } from './habits.js';

document.getElementById('root')?.remove();

async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('a') !== null).catch(() => {});
  const open = async (name) => {
    const link = [...host.querySelectorAll('a')].find((a) => a.textContent === name);
    expect(link, `a link "${name}" in the list`).toBeDefined();
    await user.click(link);
    await settle();
  };
  return {
    host, open,
    alert: () => host.querySelector('[role="alert"]'),
    detailHeading: () => host.querySelector('main h2')?.textContent,
    finish: () => { root.unmount(); host.remove(); breakHabit('h-06'); },
  };
}

test('a working habit shows its details', async () => {
  const copy = await mount();
  try {
    await copy.open(L.exercise);
    expect(copy.detailHeading(), 'detail heading of the first habit').toBe(L.exercise);
    expect(copy.alert(), 'fallback for a working habit').toBeNull();
  } finally { copy.finish(); }
});

test('a broken habit shows the fallback inside the layout', async () => {
  const copy = await mount();
  try {
    await copy.open(L.walk);
    expect(copy.alert(), 'the fallback (role="alert") for the broken habit').not.toBeNull();
    expect(copy.host.querySelector('main [role="alert"]'), 'the fallback inside <main>').not.toBeNull();
    expect(copy.host.querySelector('h1')?.textContent, 'the layout heading').toBe(L.habits);
    expect(copy.host.querySelectorAll('ul a').length, 'links in the layout list').toBe(3);
  } finally { copy.finish(); }
});

test('opening another habit after a broken one shows that habit', async () => {
  const copy = await mount();
  try {
    await copy.open(L.walk);
    await copy.open(L.water);
    expect(copy.alert(), 'fallback after opening a working habit').toBeNull();
    expect(copy.detailHeading(), 'detail heading after opening a working habit').toBe(L.water);
  } finally { copy.finish(); }
});

test('Try again renders the record again once it is repaired', async () => {
  const copy = await mount();
  try {
    await copy.open(L.walk);
    const retry = copy.alert()?.querySelector('button');
    expect(retry, 'the Try again button in the fallback').toBeDefined();
    repairHabit('h-06');
    await user.click(retry);
    await settle();
    expect(copy.alert(), 'fallback after Try again on the repaired record').toBeNull();
    expect(copy.detailHeading(), 'detail heading after Try again').toBe(L.walk);
  } finally { copy.finish(); }
});
