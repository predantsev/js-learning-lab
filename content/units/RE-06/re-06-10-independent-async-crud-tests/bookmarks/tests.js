import { createElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as testing from './testing.js';
import Bookmarks from './Bookmarks';
import { settings, requests, resetServer, whenIdle } from './fakeServer.js';

// ---------- the learner's Bookmarks, checked directly ----------

async function mount(list) {
  resetServer(list);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(Bookmarks));
  await whenIdle();
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const textOf = (node) => node.textContent.replace(/\s+/g, ' ').trim();
const links = (host) => [...host.querySelectorAll('li a')].map((a) => ({ title: textOf(a), href: a.getAttribute('href') }));
const titlesIn = (host) => links(host).map((link) => link.title);
const rowIn = (host, title) => [...host.querySelectorAll('li')].find((li) => [...li.querySelectorAll('a')].some((a) => textOf(a) === title));
const buttonIn = (node, name) => [...(node?.querySelectorAll('button') ?? [])].find((button) => textOf(button) === name) ?? null;
const fieldIn = (host, name) => [...host.querySelectorAll('label')].find((label) => textOf(label) === name)?.control ?? null;
const roleText = (host, role) => { const node = host.querySelector(`[role="${role}"]`); return node ? textOf(node) : null; };
const since = (before) => requests.slice(before).map((request) => `${request.method} ${request.path}`);

async function addCourse(host) {
  await user.type(fieldIn(host, L.titleField), L.course);
  await user.type(fieldIn(host, L.urlField), 'https://example.com/js-course');
  await user.click(buttonIn(host.querySelector('form') ?? host, L.add));
}

test('the first render says the bookmarks are loading', async () => {
  resetServer();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    root.render(createElement(Bookmarks));
    await waitFor(() => host.childNodes.length > 0);
    expect(roleText(host, 'status'), 'the role="status" text before the list arrives').toBe(L.loading);
    expect(roleText(host, 'alert'), 'the role="alert" text before the list arrives').toBe('');
    await whenIdle();
  } finally { root.unmount(); host.remove(); }
});

test('the list loads and shows every bookmark as a link', async () => {
  const copy = await mount();
  try {
    expect(links(copy.host), 'links in the list after loading').toEqual([
      { title: L.borshch, href: 'https://example.com/borshch' },
      { title: L.bus, href: 'https://example.com/bus' },
    ]);
  } finally { copy.finish(); }
});

test('an empty list says there are no bookmarks', async () => {
  const copy = await mount([]);
  try {
    expect(textOf(copy.host).includes(L.empty), `the text "${L.empty}" on an empty list`).toBe(true);
  } finally { copy.finish(); }
});

test('a failed load shows the error', async () => {
  resetServer();
  settings.failNextRead = 1;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(Bookmarks));
  try {
    await whenIdle();
    expect(roleText(host, 'alert'), 'the role="alert" text after a failed load').toBe(L.loadFailed);
  } finally { root.unmount(); host.remove(); }
});

test('adding a bookmark sends one POST and reads the list again', async () => {
  const copy = await mount();
  try {
    const before = requests.length;
    await addCourse(copy.host);
    await whenIdle();
    const sent = since(before);
    expect(sent.filter((line) => line.startsWith('POST')), 'POST requests after one Add').toEqual(['POST /api/bookmarks']);
    expect(sent.indexOf('GET /api/bookmarks') > sent.indexOf('POST /api/bookmarks'), 'a GET /api/bookmarks after the POST').toBe(true);
    expect(requests.find((request) => request.method === 'POST' && requests.indexOf(request) >= before)?.body, 'the body of the POST').toEqual({ title: L.course, url: 'https://example.com/js-course' });
    expect(titlesIn(copy.host), 'titles in the list after adding').toEqual([L.borshch, L.bus, L.course]);
  } finally { copy.finish(); }
});

test('the Add button is disabled while saving', async () => {
  const copy = await mount();
  try {
    await addCourse(copy.host);
    expect(buttonIn(copy.host.querySelector('form') ?? copy.host, L.add)?.disabled, 'the Add button right after the click').toBe(true);
    await whenIdle();
  } finally { copy.finish(); }
});

test('marking a favorite sends one PATCH and shows it pressed', async () => {
  const copy = await mount();
  try {
    const before = requests.length;
    await user.click(buttonIn(rowIn(copy.host, L.borshch), L.favorite));
    await whenIdle();
    expect(since(before).filter((line) => line.startsWith('PATCH')), 'PATCH requests after one click').toEqual(['PATCH /api/bookmarks/b-01']);
    expect(buttonIn(rowIn(copy.host, L.borshch), L.favorite)?.getAttribute('aria-pressed'), 'aria-pressed of the favorite button').toBe('true');
  } finally { copy.finish(); }
});

test('a failed favorite sends one PATCH, shows the error and leaves the bookmark as it was', async () => {
  const copy = await mount();
  try {
    settings.failNextWrite = 1;
    const before = requests.length;
    await user.click(buttonIn(rowIn(copy.host, L.bus), L.favorite));
    await whenIdle();
    expect(since(before).filter((line) => line.startsWith('PATCH')).length, 'PATCH requests after one failed click').toBe(1);
    expect(roleText(copy.host, 'alert'), 'the role="alert" text after a failed favorite').toBe(L.saveFailed);
    expect(buttonIn(rowIn(copy.host, L.bus), L.favorite)?.getAttribute('aria-pressed'), 'aria-pressed of the bus favorite button (it was true)').toBe('true');
  } finally { settings.failNextWrite = 0; copy.finish(); }
});

test('removing a bookmark sends a DELETE and takes it off the list', async () => {
  const copy = await mount();
  try {
    const before = requests.length;
    await user.click(buttonIn(rowIn(copy.host, L.bus), L.remove));
    await whenIdle();
    expect(since(before).filter((line) => line.startsWith('DELETE')), 'DELETE requests after one click').toEqual(['DELETE /api/bookmarks/b-02']);
    expect(titlesIn(copy.host), 'titles in the list after removing').toEqual([L.borshch]);
  } finally { copy.finish(); }
});

// ---------- the learner's tests ----------

// Your own code runs with other delays than the defaults (reads 150 ms, writes 300 ms); a broken copy
// runs fast, stops at the first failing test, and waiting is shortened.
async function runSuite({ replacement } = {}) {
  testing.restoreComponents();
  if (replacement) {
    testing.replaceComponent(Bookmarks, replacement);
    testing.setDefaultTimeout(600);
  }
  const prepare = () => {
    resetServer();
    Object.assign(settings, replacement ? { readDelayMs: 30, writeDelayMs: 50 } : { readDelayMs: 150, writeDelayMs: 300 });
  };
  try {
    return await testing.run({ print: false, beforeEach: prepare, bail: Boolean(replacement) });
  } finally {
    testing.restoreComponents();
    testing.setDefaultTimeout(2000);
    resetServer();
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
let passesWithOwnCode = false;
async function expectCatches(replacement) {
  expect(passesWithOwnCode, 'your tests pass with your Bookmarks (an earlier check)').toBe(true);
  const results = await runSuite({ replacement });
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

// A broken Bookmarks that follows the task's screen exactly, with one fault switched on.
function brokenBookmarks({ refreshAfterCreate = true, failSilently = false, refreshAfterRemove = true }) {
  const h = createElement;
  return function BrokenBookmarks() {
    const [data, setData] = useState(null);
    const [round, setRound] = useState(0);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
      const controller = new AbortController();
      fetch('/api/bookmarks', { signal: controller.signal }).then((r) => r.json()).then(setData).catch(() => {});
      return () => controller.abort();
    }, [round]);
    const send = async (method, path, body) => {
      const response = await fetch(path, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
      return response.ok;
    };
    async function add(event) {
      event.preventDefault();
      if (await send('POST', '/api/bookmarks', { title, url })) { setTitle(''); setUrl(''); if (refreshAfterCreate) setRound((r) => r + 1); } else setError(L.saveFailed);
    }
    async function favorite(bookmark) {
      if (failSilently) setData((current) => current.map((item) => (item.id === bookmark.id ? { ...item, favorite: !bookmark.favorite } : item)));
      if (await send('PATCH', `/api/bookmarks/${bookmark.id}`, { favorite: !bookmark.favorite })) setRound((r) => r + 1);
      else if (!failSilently) setError(L.saveFailed);
    }
    async function remove(bookmark) {
      if (await send('DELETE', `/api/bookmarks/${bookmark.id}`)) { if (refreshAfterRemove) setRound((r) => r + 1); } else setError(L.saveFailed);
    }
    return h('section', null,
      h('p', { role: 'status' }, data === null ? L.loading : ''),
      h('p', { role: 'alert' }, error),
      h('form', { onSubmit: add },
        h('label', { htmlFor: 'bookmark-title' }, L.titleField),
        h('input', { id: 'bookmark-title', value: title, onChange: (event) => setTitle(event.target.value) }),
        h('label', { htmlFor: 'bookmark-url' }, L.urlField),
        h('input', { id: 'bookmark-url', value: url, onChange: (event) => setUrl(event.target.value) }),
        h('button', { type: 'submit' }, L.add)),
      data?.length === 0 ? h('p', null, L.empty) : null,
      h('ul', null, (data ?? []).map((bookmark) => h('li', { key: bookmark.id },
        h('a', { href: bookmark.url }, bookmark.title), ' ',
        h('button', { 'aria-pressed': bookmark.favorite, onClick: () => favorite(bookmark) }, L.favorite), ' ',
        h('button', { onClick: () => remove(bookmark) }, L.remove)))));
  };
}

test('your tests pass with your Bookmarks and a slower server', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in Bookmarks.test.jsx').toBeGreaterThanOrEqual(4);
  expect(failing(results), 'your tests that fail with your Bookmarks (reads 150 ms, writes 300 ms)').toEqual([]);
  passesWithOwnCode = true;
});

test('one of your tests fails when an added bookmark never appears', async () => {
  await expectCatches(brokenBookmarks({ refreshAfterCreate: false }));
});

test('one of your tests fails when a failed favorite stays on screen without an error', async () => {
  await expectCatches(brokenBookmarks({ failSilently: true }));
});

test('one of your tests fails when a removed bookmark stays in the list', async () => {
  await expectCatches(brokenBookmarks({ refreshAfterRemove: false }));
});
