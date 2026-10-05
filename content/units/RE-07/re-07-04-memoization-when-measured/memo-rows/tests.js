import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { rowRenders } from './TaskRow';
import { evidence } from './evidence.js';

// Every check mounts its own copy and records errors React reports.
async function mount() {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  root.render(createElement(App));
  await waitFor(() => host.querySelectorAll('li').length >= 2000);
  await settle();
  return { host, errors, finish: () => { root.unmount(); host.remove(); } };
}
const box = (host, index) => host.querySelectorAll('li input[type="checkbox"]')[index];

test('toggling two tasks marks both done', async () => {
  const copy = await mount();
  try {
    await user.click(box(copy.host, 1));
    await user.click(box(copy.host, 2));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(box(copy.host, 1), 'the second task after both clicks').toBeChecked();
    expect(box(copy.host, 2), 'the third task after both clicks').toBeChecked();
    expect(box(copy.host, 0), 'the first task').not.toBeChecked();
  } finally { copy.finish(); }
});

test('toggling one task renders only that row', async () => {
  const copy = await mount();
  try {
    const before = rowRenders();
    await user.click(box(copy.host, 5));
    expect(rowRenders() - before, 'TaskRow renders for one toggle').toBe(1);
  } finally { copy.finish(); }
});

test('typing a new title renders no rows', async () => {
  const copy = await mount();
  try {
    const before = rowRenders();
    await user.type(copy.host.querySelector('form input'), 'ab');
    expect(rowRenders() - before, 'TaskRow renders while typing two letters').toBe(0);
  } finally { copy.finish(); }
});

test('adding a task puts it at the end of the list', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('form input'), L.typed);
    await user.submit(copy.host.querySelector('form'));
    const items = copy.host.querySelectorAll('li');
    expect(items.length, 'number of tasks after adding').toBe(2001);
    expect(items[2000], 'the last task').toHaveTextContent(L.typed);
  } finally { copy.finish(); }
});

test('the note shows a measured gain', () => {
  expect(typeof evidence.beforeMs, 'type of beforeMs').toBe('number');
  expect(typeof evidence.afterMs, 'type of afterMs').toBe('number');
  expect(evidence.afterMs, 'afterMs').toBeGreaterThan(0);
  expect(evidence.afterMs, 'afterMs compared with beforeMs').toBeLessThan(evidence.beforeMs);
});

test('the note says how many rows render after the change', () => {
  expect(evidence.rowsAfter, 'rowsAfter').toBe(1);
});
