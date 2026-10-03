import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { settings, requests } from './fixtureApi.js';

// Every check mounts its own copy of the search and removes it afterwards.
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('input') !== null);
  return { host, input: host.querySelector('input'), finish: () => { root.unmount(); host.remove(); } };
}
const shown = (host) => [...host.querySelectorAll('li')].map((li) => li.textContent.trim());
const alertOf = (host) => host.querySelector('[role="alert"]');
const first = () => L.query.slice(0, 1);

test('a query typed slowly lists the matching habits', async () => {
  settings.failNext = 0;
  const copy = await mount();
  try {
    await user.type(copy.input, first());
    await sleep(600);
    await user.type(copy.input, L.query.slice(1));
    await sleep(400);
    expect(shown(copy.host), `habits listed for "${L.query}"`).toEqual([L.hitOne, L.hitTwo]);
  } finally { copy.finish(); }
});

test('after fast typing only the latest query\'s habits stay', async () => {
  settings.failNext = 0;
  const copy = await mount();
  try {
    await user.type(copy.input, L.query);
    await sleep(700);
    expect(shown(copy.host), `habits listed 0.7 s after typing "${L.query}" quickly`).toEqual([L.hitOne, L.hitTwo]);
  } finally { copy.finish(); }
});

test('the request for the older query is aborted', async () => {
  settings.failNext = 0;
  const copy = await mount();
  const before = requests.length;
  try {
    await user.type(copy.input, L.query);
    await sleep(700);
    const older = requests.slice(before).filter((request) => request.query === first());
    expect(older.length, `requests sent for "${first()}"`).toBeGreaterThan(0);
    expect(older.map((request) => request.outcome), `what happened to the requests for "${first()}"`).toEqual(older.map(() => 'aborted'));
  } finally { copy.finish(); }
});

test('an aborted request does not show the error message', async () => {
  settings.failNext = 0;
  const copy = await mount();
  try {
    await user.type(copy.input, L.query);
    await sleep(700);
    expect(alertOf(copy.host), 'the role="alert" message after fast typing').toBeNull();
  } finally { copy.finish(); }
});

test('a failed search shows the error message', async () => {
  settings.failNext = 1;
  const copy = await mount();
  try {
    await user.type(copy.input, first());
    await sleep(600);
    expect(alertOf(copy.host)?.textContent.trim() ?? null, 'the role="alert" message after a failed search').toBe(L.searchError);
  } finally { settings.failNext = 0; copy.finish(); }
});
