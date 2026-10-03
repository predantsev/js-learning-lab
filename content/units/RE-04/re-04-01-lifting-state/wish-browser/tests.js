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
  await waitFor(() => host.querySelector('h3') !== null);
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const listButton = (host, name) => [...host.querySelectorAll('li button')].find((b) => b.textContent.trim() === name);
const heading = (host) => host.querySelector('h3').textContent.trim();
const counts = () => ({ ...renderCounts });
const delta = (before, name) => (renderCounts[name] ?? 0) - (before[name] ?? 0);

test('selecting a wish in the list shows it in the detail panel', async () => {
  const copy = await mount();
  try {
    await user.click(listButton(copy.host, L.lamp));
    expect(heading(copy.host), 'detail heading after selecting the lamp').toBe(L.lamp);
    expect(copy.host.querySelector('article p'), 'detail price').toHaveTextContent('45');
    await user.click(listButton(copy.host, L.bicycle));
    expect(heading(copy.host), 'detail heading after selecting the bicycle').toBe(L.bicycle);
  } finally { copy.finish(); }
});

test('the list marks exactly the selected wish', async () => {
  const copy = await mount();
  try {
    await user.click(listButton(copy.host, L.mug));
    const pressed = [...copy.host.querySelectorAll('li button')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent.trim());
    expect(pressed, 'buttons with aria-pressed="true"').toEqual([L.mug]);
  } finally { copy.finish(); }
});

test('renaming updates the list and the detail panel', async () => {
  const copy = await mount();
  try {
    await user.click(listButton(copy.host, L.bicycle));
    await user.fill(copy.host.querySelector('article input'), L.newBike);
    await user.submit(copy.host.querySelector('article form'));
    expect(listButton(copy.host, L.newBike), 'list button with the new name').toBeDefined();
    expect(listButton(copy.host, L.bicycle), 'list button with the old name').toBeUndefined();
    expect(listButton(copy.host, L.headphones), 'the headphones, which were not renamed').toBeDefined();
    expect(heading(copy.host), 'detail heading after renaming').toBe(L.newBike);
  } finally { copy.finish(); }
});

test('typing a new name re-renders only the detail panel', async () => {
  const copy = await mount();
  try {
    const before = counts();
    await user.type(copy.host.querySelector('article input'), 'abc');
    expect(delta(before, 'WishDetail'), 'WishDetail renders while typing 3 letters').toBeGreaterThan(0);
    expect(delta(before, 'WishBrowser'), 'WishBrowser renders while typing').toBe(0);
    expect(delta(before, 'WishList'), 'WishList renders while typing').toBe(0);
  } finally { copy.finish(); }
});

test('selecting a wish does not re-render App', async () => {
  const copy = await mount();
  try {
    const before = counts();
    await user.click(listButton(copy.host, L.lamp));
    expect(delta(before, 'WishBrowser'), 'WishBrowser renders after selecting').toBeGreaterThan(0);
    expect(delta(before, 'App'), 'App renders after selecting').toBe(0);
  } finally { copy.finish(); }
});
