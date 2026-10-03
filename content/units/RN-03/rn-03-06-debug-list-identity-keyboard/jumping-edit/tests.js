import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { TaskScreen } from './TaskScreen.jsx';

const tasks = () => [
  { id: 't-01', title: L.water, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.library, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.grandma, dueDate: null, done: false, priority: 'low' },
  { id: 't-05', title: L.dentist, dueDate: '2026-03-10', done: false, priority: 'normal' },
];

// Mounts a fresh TaskScreen in its own box, so every check starts from the same four tasks.
function mount() {
  const box = document.createElement('div');
  box.style.cssText = 'height:400px;display:flex;flex-direction:column';
  document.body.append(box);
  const root = createRoot(box);
  flushSync(() => root.render(createElement(TaskScreen, { initialTasks: tasks() })));
  const byLabel = (label) => [...box.querySelectorAll('[aria-label]')].find((el) => el.getAttribute('aria-label') === label);
  return {
    field: (title) => byLabel(`${L.rename}: ${title}`),
    removeButton: (title) => byLabel(`${L.remove}: ${title}`),
    fields: () => [...box.querySelectorAll('input')],
    done: () => {
      root.unmount();
      box.remove();
    },
  };
}

test('after a delete every field shows its own task', async () => {
  const screenBox = mount();
  try {
    await user.click(screenBox.removeButton(L.water));
    await sleep(30);
    for (const title of [L.library, L.grandma, L.dentist]) {
      expect(screenBox.field(title)?.value, `field of “${title}”`).toBe(title);
    }
  } finally {
    screenBox.done();
  }
});

test('a half-typed rename stays with its task after another task is deleted', async () => {
  const screenBox = mount();
  try {
    await user.type(screenBox.field(L.grandma), L.extra);
    await user.click(screenBox.removeButton(L.water));
    await sleep(30);
    expect(screenBox.field(L.grandma)?.value, `field of “${L.grandma}”`).toBe(L.grandma + L.extra);
    expect(screenBox.field(L.dentist)?.value, `field of “${L.dentist}”`).toBe(L.dentist);
  } finally {
    screenBox.done();
  }
});

test('submitting a rename after a delete renames the same task', async () => {
  const screenBox = mount();
  try {
    await user.type(screenBox.field(L.grandma), L.extra);
    await user.click(screenBox.removeButton(L.water));
    await sleep(30);
    await user.press('Enter', screenBox.field(L.grandma));
    await sleep(30);
    expect(Boolean(screenBox.field(L.grandma + L.extra)), `a field for “${L.grandma + L.extra}”`).toBe(true);
    expect(screenBox.field(L.dentist)?.value, `field of “${L.dentist}”`).toBe(L.dentist);
  } finally {
    screenBox.done();
  }
});

test('removing a task removes exactly that task', async () => {
  const screenBox = mount();
  try {
    await user.click(screenBox.removeButton(L.library));
    await sleep(30);
    expect(screenBox.fields().map((input) => input.value), 'fields left').toEqual([L.water, L.grandma, L.dentist]);
  } finally {
    screenBox.done();
  }
});
