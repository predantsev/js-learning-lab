import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Every check mounts its own copy of the list. Every assignment to document.title is recorded
// together with the number the copy's <p> shows at that moment.
const proto = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const sets = [];
  Object.defineProperty(document, 'title', {
    configurable: true,
    get: () => proto.get.call(document),
    set: (value) => {
      sets.push({ value: String(value), screen: host.querySelector('p')?.textContent ?? '' });
      proto.set.call(document, value);
    },
  });
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('p') !== null);
  await settle();
  return { host, sets };
}
const restore = () => { delete document.title; };
const filterButton = (host, label) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
const expected = (n) => `${L.titlePrefix} ${n}`;

test('the title shows the number of visible tasks on the first display', async () => {
  try {
    await mount();
    expect(document.title, 'document.title after the first display').toBe(expected(4));
  } finally { restore(); }
});

test('the title follows the filter', async () => {
  try {
    const { host } = await mount();
    await user.click(filterButton(host, L.pending));
    expect(document.title, 'document.title with the “pending” filter').toBe(expected(3));
    await user.click(filterButton(host, L.done));
    expect(document.title, 'document.title with the “done” filter').toBe(expected(1));
  } finally { restore(); }
});

test('the title follows a task marked as done', async () => {
  try {
    const { host } = await mount();
    await user.click(filterButton(host, L.pending));
    await user.click(host.querySelector('input[type="checkbox"]'));
    expect(document.title, 'document.title after a pending task was marked done').toBe(expected(2));
  } finally { restore(); }
});

test('the title changes only after the screen shows the same number', async () => {
  try {
    const { host, sets } = await mount();
    await user.click(filterButton(host, L.pending));
    await user.click(filterButton(host, L.done));
    expect(sets.length, 'number of assignments to document.title').toBeGreaterThan(0);
    for (const set of sets) expect(set.value, `title assigned while the screen showed “${set.screen}”`).toBe(set.screen);
  } finally { restore(); }
});
