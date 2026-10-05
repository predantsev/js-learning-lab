import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import App from './App';
import { SelectList } from './SelectList';

// Draws an element into its own container and returns helpers; unmount() removes it again.
function mount(element) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(element));
  return { host, unmount: () => { root.unmount(); host.remove(); } };
}

const fruits = [
  { code: 'f-1', title: L.apple },
  { code: 'f-2', title: L.pear },
  { code: 'f-3', title: L.plum },
];
const fruitProps = (overrides) => ({
  label: L.fruitLabel,
  items: fruits,
  selected: fruits[0],
  getKey: (fruit) => fruit.code,
  getLabel: (fruit) => fruit.title,
  onSelect: () => {},
  ...overrides,
});
const buttonsIn = (host) => [...host.querySelectorAll('button')];
// The accessible name of a group: the <legend> of a <fieldset>, otherwise aria-label / aria-labelledby.
function groupName(element) {
  if (element.tagName === 'FIELDSET') return element.querySelector('legend')?.textContent.trim() ?? '';
  return element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby') ? screen.nameOf(element) : '';
}

test('shows a group named by label with one button per item', () => {
  const { host, unmount } = mount(createElement(SelectList, fruitProps()));
  try {
    const group = host.querySelector('[role="group"], fieldset');
    expect(group, 'an element with role="group" or a <fieldset>').toBeTruthy();
    expect(groupName(group), 'the name of the group').toBe(L.fruitLabel);
    expect(buttonsIn(host).map((button) => button.textContent.trim()), 'the button texts').toEqual([L.apple, L.pear, L.plum]);
  } finally { unmount(); }
});

test('marks the selected item with aria-pressed, matched by its key', () => {
  // `selected` is an equal copy, not the same object: the match must go through getKey.
  const { host, unmount } = mount(createElement(SelectList, fruitProps({ selected: { code: 'f-2', title: L.pear } })));
  try {
    expect(buttonsIn(host).map((button) => button.getAttribute('aria-pressed')), 'aria-pressed of the three buttons').toEqual(['false', 'true', 'false']);
  } finally { unmount(); }
});

test('a click calls onSelect with the item itself', async () => {
  const onSelect = spy();
  const { host, unmount } = mount(createElement(SelectList, fruitProps({ onSelect })));
  try {
    await user.click(buttonsIn(host)[2]);
    expect(onSelect, 'onSelect after a click on the third button').toHaveBeenCalledTimes(1);
    expect(onSelect.calls[0][0] === fruits[2], 'onSelect received the third item object').toBe(true);
  } finally { unmount(); }
});

test('works with plain strings as items', async () => {
  const sizes = ['S', 'M', 'L'];
  const onSelect = spy();
  const { host, unmount } = mount(createElement(SelectList, { label: L.sizeLabel, items: sizes, selected: 'M', getKey: (size) => size, getLabel: (size) => size, onSelect }));
  try {
    expect(buttonsIn(host).map((button) => button.textContent.trim()), 'the button texts').toEqual(sizes);
    expect(buttonsIn(host)[1].getAttribute('aria-pressed'), 'aria-pressed of "M"').toBe('true');
    await user.click(buttonsIn(host)[2]);
    expect(onSelect.calls[0]?.[0], 'onSelect after a click on "L"').toBe('L');
  } finally { unmount(); }
});

test('the page filters the tasks with the status SelectList', async () => {
  const { host, unmount } = mount(createElement(App));
  try {
    const group = [...host.querySelectorAll('[role="group"], fieldset')].find((element) => groupName(element) === L.statusLabel);
    expect(group, `a group named "${L.statusLabel}" on the page`).toBeTruthy();
    const titles = () => [...host.querySelectorAll('li')].map((item) => item.textContent.trim());
    expect(titles(), 'tasks with "all" selected').toEqual([L.plants, L.library, L.internet, L.wardrobe]);
    const done = [...group.querySelectorAll('button')].find((button) => button.textContent.trim() === L.done);
    await user.click(done);
    expect(titles(), 'tasks after choosing "done"').toEqual([L.internet, L.wardrobe]);
    expect(done.getAttribute('aria-pressed'), 'aria-pressed of the "done" button').toBe('true');
  } finally { unmount(); }
});
