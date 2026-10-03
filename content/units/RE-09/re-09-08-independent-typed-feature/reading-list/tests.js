import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { parseBook } from './readingModel';
import { readingReducer } from './readingReducer';
import { useReadingList } from './ReadingListContext';
import { server, resetServer } from './readingServer';
import { subject } from './subject';
import { run } from './testing';

// The page's own copy is taken off the page, so ids stay unique while each check mounts a fresh copy.
document.getElementById('root')?.remove();

const GOOD_API = { id: 'b-07', title: `  ${L.bookRiver}  `, author: L.authorRiver, page_count: 240, state: 'finished' };

async function mountApp() {
  resetServer();
  const host = document.createElement('div');
  document.body.append(host);
  const errors = [];
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) });
  root.render(createElement(App));
  await waitFor(() => host.querySelectorAll('li').length > 0 || errors.length > 0);
  const q = (selector) => host.querySelector(selector);
  const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
  const field = (label) => {
    const tag = [...host.querySelectorAll('label')].find((l) => l.textContent.trim() === label);
    return tag ? host.querySelector(`#${tag.htmlFor}`) : null;
  };
  const alerts = () => [...host.querySelectorAll('[role="alert"]')].map((el) => el.textContent.trim()).filter(Boolean);
  const titles = () => [...host.querySelectorAll('li')].map((li) => li.textContent);
  return { host, errors, q, button, field, alerts, titles, finish: () => { root.unmount(); host.remove(); resetServer(); } };
}
const described = (input) => (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)?.textContent.trim() ?? '').join(' ');
async function fillForm(app, title, author, pages) {
  await user.fill(app.field(L.titleLabel), title);
  await user.fill(app.field(L.authorLabel), author);
  await user.fill(app.field(L.pagesLabel), pages);
  await user.click(app.button(L.add));
  // Waits until the fixture server has answered, then lets React finish.
  await waitFor(() => server.pending === 0);
  await settle();
}

test('parseBook turns a valid API book into a Book', () => {
  expect(typeof parseBook, 'type of parseBook').toBe('function');
  expect(parseBook(GOOD_API), 'parseBook of a valid book').toEqual({ ok: true, value: { id: 'b-07', title: L.bookRiver, author: L.authorRiver, pages: 240, status: 'done' } });
  expect(parseBook({ ...GOOD_API, state: 'to_read' }).value?.status, 'status for "to_read"').toBe('toRead');
});

test('parseBook rejects bad records with the field keys from the task', () => {
  const errorsOf = (input) => {
    const result = parseBook(input);
    expect(result?.ok, `ok for ${JSON.stringify(input) ?? 'undefined'}`).toBe(false);
    return result.errors;
  };
  expect(errorsOf(null), 'errors for null').toEqual({ record: 'notObject' });
  expect(errorsOf([GOOD_API]), 'errors for an array').toEqual({ record: 'notObject' });
  expect(errorsOf({ ...GOOD_API, title: ' ' })?.title, 'errors.title for a title of spaces').toBe('required');
  expect(errorsOf({ ...GOOD_API, author: 7 })?.author, 'errors.author for the number 7').toBe('required');
  expect(errorsOf({ ...GOOD_API, page_count: '240' })?.pages, 'errors.pages for the text "240"').toBe('positiveInteger');
  expect(errorsOf({ ...GOOD_API, page_count: 12.5 })?.pages, 'errors.pages for 12.5').toBe('positiveInteger');
  expect(errorsOf({ ...GOOD_API, state: 'paused' })?.status, 'errors.status for "paused"').toBe('unknownStatus');
});

test('a damaged list shows an alert with Try again, which loads the good list', async () => {
  resetServer();
  server.listOverride = [{ id: 'b-01', title: L.bookSea, author: L.authorSea, page_count: '320', state: 'reading' }];
  const host = document.createElement('div');
  document.body.append(host);
  const errors = [];
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) });
  try {
    root.render(createElement(App));
    await waitFor(() => host.querySelector('[role="alert"]') !== null || errors.length > 0 || host.querySelector('li') !== null);
    expect(errors.map((e) => e.message), 'render errors').toEqual([]);
    expect(host.querySelector('li'), 'a list item from the damaged answer').toBeNull();
    const retry = [...host.querySelectorAll('[role="alert"] button')].find((b) => b.textContent.trim() === L.tryAgain);
    expect(retry, `a "${L.tryAgain}" button inside the alert`).toBeTruthy();
    server.listOverride = null;
    await user.click(retry);
    await waitFor(() => host.querySelectorAll('li').length === 2);
    expect(host.querySelectorAll('li').length, 'books after Try again').toBe(2);
  } finally { root.unmount(); host.remove(); resetServer(); }
});

test('a failed list request shows the alert too', async () => {
  resetServer();
  server.failNextList = true;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    root.render(createElement(App));
    await waitFor(() => host.querySelector('[role="alert"]') !== null || host.querySelector('li') !== null);
    expect(host.querySelector('[role="alert"]'), 'the alert after a failed list request').toBeTruthy();
  } finally { root.unmount(); host.remove(); resetServer(); }
});

test('the reducer follows the transition table', () => {
  const book = { id: 'b-09', title: L.bookSea, author: L.authorSea, pages: 320, status: 'reading' };
  const make = { loading: () => ({ status: 'loading' }), ready: () => ({ status: 'ready', books: [book] }), failed: () => ({ status: 'failed', message: 'listFailed' }) };
  const actions = { loaded: { type: 'loaded', books: [] }, loadFailed: { type: 'loadFailed', message: 'listFailed' }, reloaded: { type: 'reloaded' } };
  const table = [
    ['loading', 'loaded', 'ready'], ['loading', 'loadFailed', 'failed'], ['loading', 'reloaded', 'same'],
    ['ready', 'loaded', 'ready'], ['ready', 'loadFailed', 'same'], ['ready', 'reloaded', 'same'],
    ['failed', 'loaded', 'same'], ['failed', 'loadFailed', 'same'], ['failed', 'reloaded', 'loading'],
  ];
  for (const [from, action, to] of table) {
    const state = make[from]();
    const next = readingReducer(state, actions[action]);
    if (to === 'same') expect(next === state, `${from} + ${action} returns the same state`).toBe(true);
    else expect(next?.status, `${from} + ${action}`).toBe(to);
  }
});

test('useReadingList throws outside its provider, naming itself', async () => {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) });
  function Probe() { useReadingList(); return createElement('p', null, 'probe'); }
  try {
    root.render(createElement(Probe));
    await waitFor(() => errors.length > 0 || host.querySelector('p') !== null);
    expect(errors.length, 'errors for a component outside the provider').toBe(1);
    expect(errors[0].message, 'the error message').toContain('useReadingList');
  } finally { root.unmount(); host.remove(); }
});

test('invalid form fields are marked and described', async () => {
  const app = await mountApp();
  try {
    await fillForm(app, '', L.authorRiver, '12.5');
    const title = app.field(L.titleLabel);
    const pages = app.field(L.pagesLabel);
    expect(title.getAttribute('aria-invalid'), 'aria-invalid of the title').toBe('true');
    expect(described(title), 'the description of the title').toBe(L.required);
    expect(pages.getAttribute('aria-invalid'), 'aria-invalid of the pages').toBe('true');
    expect(described(pages), 'the description of the pages').toBe(L.positiveInteger);
    expect(app.field(L.authorLabel).getAttribute('aria-invalid'), 'aria-invalid of the valid author').not.toBe('true');
    expect(server.calls.create, 'create requests for an invalid form').toBe(0);
  } finally { app.finish(); }
});

test('adding a book sends the API payload and requests the list again', async () => {
  const app = await mountApp();
  try {
    const before = server.calls.list;
    await fillForm(app, L.bookRiver, L.authorRiver, '240');
    await waitFor(() => app.titles().some((text) => text.includes(L.bookRiver)));
    expect(server.books.at(-1), 'the stored book').toEqual({ id: 'b-03', title: L.bookRiver, author: L.authorRiver, page_count: 240, state: 'to_read' });
    expect(server.calls.list - before, 'list requests after one add').toBe(1);
    expect(app.field(L.titleLabel), 'the title field after a successful add').toHaveValue('');
  } finally { app.finish(); }
});

test('a rejected save is announced and keeps the draft', async () => {
  const app = await mountApp();
  try {
    server.failNextSave = true;
    await fillForm(app, L.bookRiver, L.authorRiver, '240');
    expect(app.alerts(), 'texts of role="alert"').toEqual([L.saveFailed]);
    expect(app.field(L.titleLabel), 'the title field').toHaveValue(L.bookRiver);
    expect(app.field(L.pagesLabel), 'the pages field').toHaveValue('240');
  } finally { app.finish(); }
});

test('a damaged answer to a write is announced and keeps the draft', async () => {
  const app = await mountApp();
  try {
    server.writeOverride = { id: 'b-03', title: L.bookRiver };
    await fillForm(app, L.bookRiver, L.authorRiver, '240');
    expect(app.alerts(), 'texts of role="alert"').toEqual([L.badResponse]);
    expect(app.field(L.titleLabel), 'the title field').toHaveValue(L.bookRiver);
  } finally { app.finish(); }
});

test('marking a book done requests the list again and shows the new status', async () => {
  const app = await mountApp();
  try {
    server.books[0].title = L.bookSeaRenamed; // changed on the server meanwhile: only a new list request shows it
    const before = server.calls.list;
    const item = app.q('[data-id="b-01"]');
    await user.click([...item.querySelectorAll('button')].find((b) => b.textContent.trim() === L.markDone));
    await waitFor(() => (app.q('[data-id="b-01"]')?.textContent ?? '').includes(L.bookSeaRenamed));
    expect(server.calls.list - before, 'list requests after marking done').toBe(1);
    expect(app.q('[data-id="b-01"]').textContent, 'the first book').toContain(L.done);
  } finally { app.finish(); }
});

test('a crashing cover shows a fallback in its own card only', async () => {
  resetServer();
  server.brokenCovers = ['b-02'];
  const host = document.createElement('div');
  document.body.append(host);
  const errors = [];
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) });
  try {
    root.render(createElement(App));
    await waitFor(() => host.querySelectorAll('li').length > 0 || errors.length > 0 || host.querySelector('[role="alert"]') !== null);
    await settle();
    expect(errors.map((e) => e.message), 'errors that reached the root').toEqual([]);
    const broken = host.querySelector('[data-id="b-02"]');
    expect(broken, 'the card of b-02').toBeTruthy();
    expect(broken.querySelector('[role="alert"]')?.textContent.trim(), 'the fallback inside the card of b-02').toBe(L.coverFailed);
    expect(broken.textContent, 'the card of b-02 still shows its title').toContain(L.bookGarden);
    expect(host.querySelector('[data-id="b-01"] [role="alert"]'), 'a fallback in the card of b-01').toBeNull();
  } finally { root.unmount(); host.remove(); resetServer(); }
});

const failing = (results) => results.filter((r) => !r.passed).map((r) => `${r.name} — ${r.message}`);
async function suiteWith(reducer) {
  const original = subject.readingReducer;
  if (reducer) subject.readingReducer = reducer;
  try { return await run({ print: false }); } finally { subject.readingReducer = original; }
}
const loose = (overrides) => (state, action) => {
  const key = `${state.status}+${action.type}`;
  if (key in overrides) return overrides[key](state, action);
  return readingReducer(state, action);
};

test('your transition table has at least 8 tests and passes on your reducer', async () => {
  const results = await suiteWith(null);
  expect(results.length, 'tests in transitions.test.ts').toBeGreaterThanOrEqual(8);
  expect(failing(results), 'your tests that fail on your reducer').toEqual([]);
});

test('your table catches a reducer that wipes the list when a refresh fails', async () => {
  const results = await suiteWith(loose({ 'ready+loadFailed': (state, action) => ({ status: 'failed', message: action.message }) }));
  expect(results.some((r) => !r.passed), 'one of your tests fails with this reducer').toBe(true);
});

test('your table catches a reducer that accepts a late answer after a failure', async () => {
  const results = await suiteWith(loose({ 'failed+loaded': (state, action) => ({ status: 'ready', books: action.books }) }));
  expect(results.some((r) => !r.passed), 'one of your tests fails with this reducer').toBe(true);
});

test('decisions.md answers both questions', () => {
  const sections = (files['decisions.md'] ?? '').split(/^## /m).slice(1).map((part) => part.split('\n').slice(1).join(' ').trim());
  expect(sections.length, 'sections that start with "## " in decisions.md').toBe(2);
  sections.forEach((answer, index) => expect(answer.length, `length of answer ${index + 1}`).toBeGreaterThanOrEqual(40));
});
