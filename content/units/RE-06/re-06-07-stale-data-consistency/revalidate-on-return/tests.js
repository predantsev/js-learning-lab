import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { settings, requests, resetServer, editOnServer } from './fakeServer.js';
import { resetExpensesQuery } from './expensesQuery.js';

const DELAY = 100;
const answered = () => sleep(DELAY + 200);

// Every check starts a fresh server and cache and mounts its own copy.
async function mount() {
  resetServer();
  resetExpensesQuery();
  settings.delayMs = DELAY;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelectorAll('li').length === 3, { timeout: 1500 });
  await sleep(50);
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const labels = (host) => [...host.querySelectorAll('li')].map((li) => li.textContent.trim());
const buttonNamed = (host, text) => [...host.querySelectorAll('button')].find((button) => button.textContent.trim() === text);
const stamp = (host) => [...host.querySelectorAll('p')].map((p) => p.textContent.trim()).find((text) => text.startsWith(L.updatedAt)) ?? null;
const listGets = (before) => requests.slice(before).filter((request) => request.method === 'GET' && request.path === '/api/expenses').length;

async function openAndReturn(copy) {
  await user.click(buttonNamed(copy.host, L.transit));
  await user.click(buttonNamed(copy.host, L.back));
}

test('the list shows when its data was fetched', async () => {
  const copy = await mount();
  try {
    expect(stamp(copy.host), 'the "updated at" paragraph after the first load').toBe(`${L.updatedAt} 10:00`);
  } finally { copy.finish(); }
});

test('returning to the list shows the cached expenses at once', async () => {
  const copy = await mount();
  try {
    await openAndReturn(copy);
    expect(labels(copy.host), 'list items right after returning').toEqual([L.groceries, L.transit, L.coffee]);
  } finally { copy.finish(); }
});

test('returning to the list fetches it once more', async () => {
  const copy = await mount();
  try {
    const before = requests.length;
    await openAndReturn(copy);
    await answered();
    expect(listGets(before), 'GET /api/expenses sent after returning').toBe(1);
  } finally { copy.finish(); }
});

test('a change made elsewhere shows after returning', async () => {
  const copy = await mount();
  try {
    await user.click(buttonNamed(copy.host, L.transit));
    editOnServer('e-02', { label: L.monthlyPass });
    await user.click(buttonNamed(copy.host, L.back));
    await answered();
    expect(labels(copy.host), 'list items after returning').toEqual([L.groceries, L.monthlyPass, L.coffee]);
  } finally { copy.finish(); }
});

test('after returning the label shows the time of the new answer', async () => {
  const copy = await mount();
  try {
    await openAndReturn(copy);
    await answered();
    expect(stamp(copy.host), 'the "updated at" paragraph after returning').toBe(`${L.updatedAt} 10:05`);
  } finally { copy.finish(); }
});

test('the list does not fetch again while it stays on screen', async () => {
  const copy = await mount();
  try {
    const before = requests.length;
    await sleep(700);
    expect(listGets(before), 'GET /api/expenses sent while the list stayed on screen for 0.7 s').toBe(0);
  } finally { copy.finish(); }
});
