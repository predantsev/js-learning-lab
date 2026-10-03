import { createElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as testing from './testing.js';
import WishBoard from './WishBoard';
import { settings, requests, resetServer, whenIdle } from './fakeServer.js';
import { searchWishes, updateWish } from './api.js';

async function runSuite(replacement) {
  testing.restoreComponents();
  if (replacement) {
    testing.replaceComponent(WishBoard, replacement);
    testing.setDefaultTimeout(800);
  }
  try {
    return await testing.run({ print: false, beforeEach: resetServer, bail: Boolean(replacement) });
  } finally {
    testing.restoreComponents();
    testing.setDefaultTimeout(2000);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

// The original search without a cleanup (the toggle is already repaired here), as a plain component.
function RacySearchBoard() {
  const h = createElement;
  const [query, setQuery] = useState('');
  const [wishes, setWishes] = useState([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    searchWishes(query).then(setWishes);
  }, [query]);
  async function toggleAcquired(id) {
    const wish = wishes.find((item) => item.id === id);
    const set = (value) => setWishes((current) => current.map((item) => (item.id === id ? { ...item, acquired: value } : item)));
    set(!wish.acquired);
    setMessage('');
    const result = await updateWish(id, { acquired: !wish.acquired });
    if (!result.ok) { set(wish.acquired); setMessage(L.saveFailed.replace('{name}', wish.name)); }
  }
  return h('section', null,
    h('label', { htmlFor: 'wish-query' }, L.searchLabel),
    h('input', { id: 'wish-query', value: query, onChange: (event) => setQuery(event.target.value) }),
    h('ul', null, wishes.map((wish) => h('li', { key: wish.id }, h('label', null,
      h('input', { type: 'checkbox', checked: wish.acquired, onChange: () => toggleAcquired(wish.id) }), ' ', wish.name)))),
    h('p', { role: 'status' }, message));
}

// Direct checks mount their own copy of the learner's WishBoard.
async function mount() {
  resetServer();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(WishBoard));
  await waitFor(() => host.querySelector('input') !== null);
  await whenIdle();
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const rowsIn = (host) => [...host.querySelectorAll('li')].map((li) => li.textContent.trim());
const boxIn = (host, name) => [...host.querySelectorAll('li')].find((li) => li.textContent.trim() === name)?.querySelector('input');

test('your tests pass with your WishBoard, the two given tests included', async () => {
  const results = await runSuite();
  const names = results.map((result) => result.name);
  expect(names.includes(L.testSearch) && names.includes(L.testToggle), 'the two given tests are still in WishBoard.test.jsx').toBe(true);
  expect(results.length, 'number of tests in WishBoard.test.jsx').toBeGreaterThanOrEqual(3);
  expect(failing(results), 'your tests that fail with your WishBoard').toEqual([]);
});

test('one of your tests fails with the original search that has no cleanup', async () => {
  const results = await runSuite(RacySearchBoard);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the original search').toBe(true);
});

test('after fast typing only the latest query\'s wishes stay', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('input'), L.query);
    await whenIdle();
    expect(rowsIn(copy.host), `wishes listed after typing "${L.query}" quickly`).toEqual(L.hits.split('|'));
  } finally { copy.finish(); }
});

test('a failed toggle puts back only that wish', async () => {
  const copy = await mount();
  try {
    settings.failNext = 1;
    await user.click(boxIn(copy.host, L.lamp));
    await sleep(40);
    await user.click(boxIn(copy.host, L.bicycle));
    await whenIdle();
    expect(boxIn(copy.host, L.lamp)?.checked, 'the lamp checkbox (its change failed)').toBe(false);
    expect(boxIn(copy.host, L.bicycle)?.checked, 'the bicycle checkbox (its change succeeded)').toBe(true);
  } finally { copy.finish(); }
});

test('a failed toggle sends one request and announces the failure', async () => {
  const copy = await mount();
  try {
    settings.failNext = 1;
    const before = requests.length;
    await user.click(boxIn(copy.host, L.lamp));
    await whenIdle();
    const patches = requests.slice(before).filter((request) => request.method === 'PATCH');
    expect(patches.length, 'PATCH requests sent by one failed toggle').toBe(1);
    expect(copy.host.querySelector('[role="status"]')?.textContent.trim(), 'the role="status" text').toBe(L.saveFailed.replace('{name}', L.lamp));
  } finally { copy.finish(); }
});
