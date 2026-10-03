import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { WishList } from './WishList.jsx';

// Renders WishList into its own 300 px tall box and returns helpers for it.
function mount(wishes) {
  const box = document.createElement('div');
  box.style.cssText = 'height:300px;display:flex;flex-direction:column';
  document.body.append(box);
  const root = createRoot(box);
  const render = (list) => flushSync(() => root.render(createElement(WishList, { wishes: list })));
  render(wishes);
  return {
    box,
    render,
    cards: () => box.querySelectorAll('[data-testid="wish-card"]'),
    separators: () => box.querySelectorAll('[data-testid="wish-separator"]'),
    note: (name) => [...box.querySelectorAll('input')].find((input) => input.getAttribute('aria-label') === `${L.note}: ${name}`),
    done: () => {
      root.unmount();
      box.remove();
    },
  };
}

const wish = (id, name) => ({ id, name, price: null, acquired: false, category: null });
const six = () => [
  wish('w-01', L.headphones), wish('w-02', L.lamp), wish('w-03', L.bicycle),
  wish('w-04', L.book), wish('w-05', L.tickets), wish('w-06', L.mug),
];

test('the list shows every wish of a short list', async () => {
  const list = mount(six());
  await sleep(50);
  const text = list.box.textContent;
  list.done();
  for (const name of [L.headphones, L.lamp, L.bicycle, L.book, L.tickets, L.mug]) expect(text, 'text of the list').toContain(name);
});

test('a 1,000-wish list mounts only a window of rows', async () => {
  const many = Array.from({ length: 1000 }, (_, i) => wish(`w-${i}`, `${L.plant} ${i}`));
  const list = mount(many);
  await sleep(300);
  const mounted = list.cards().length;
  list.done();
  expect(mounted, 'cards mounted for 1,000 wishes').toBeGreaterThan(0);
  expect(mounted, 'cards mounted for 1,000 wishes').toBeLessThan(500);
});

test('an empty list shows the empty message', async () => {
  const list = mount([]);
  await sleep(50);
  const text = list.box.textContent;
  list.done();
  expect(text, 'text of an empty list').toContain(L.empty);
});

test('separators sit only between cards', async () => {
  const list = mount(six());
  await sleep(50);
  const count = list.separators().length;
  list.done();
  expect(count, 'separators for 6 cards').toBe(5);
});

test('a half-typed note stays with its wish after a wish is added at the top', async () => {
  const list = mount(six());
  await sleep(50);
  await user.type(list.note(L.bicycle), L.draft);
  list.render([wish('w-07', L.plant), ...six()]);
  await sleep(50);
  const bicycle = list.note(L.bicycle)?.value;
  const lamp = list.note(L.lamp)?.value;
  list.done();
  expect(bicycle, `note of “${L.bicycle}”`).toBe(L.draft);
  expect(lamp, `note of “${L.lamp}”`).toBe('');
});
