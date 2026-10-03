import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App, { WishList, WishSection } from './App';
import { useWishes } from './useWishes.js';
import { renderCounts } from './renders.js';

async function mount(element) {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  root.render(element);
  await settle();
  return { host, errors, finish: () => { root.unmount(); host.remove(); } };
}
const names = (host) => [...host.querySelectorAll('li span')].map((s) => s.textContent.trim());
const delta = (before, name) => (renderCounts[name] ?? 0) - (before[name] ?? 0);

test('typing a new wish re-renders only the form', async () => {
  const copy = await mount(createElement(App));
  try {
    const before = { ...renderCounts };
    await user.type(copy.host.querySelector('form input'), 'abc');
    expect(delta(before, 'AddWishForm'), 'AddWishForm renders while typing 3 letters').toBeGreaterThan(0);
    for (const name of ['App', 'WishLayout', 'WishSection', 'WishList']) expect(delta(before, name), `${name} renders while typing`).toBe(0);
  } finally { copy.finish(); }
});

test('WishSection shows the children it receives', async () => {
  const copy = await mount(createElement(WishSection, { title: L.heading }, createElement('p', { 'data-probe': '' }, 'probe')));
  try {
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(copy.host.querySelector('h3'), 'the section heading').toHaveTextContent(L.heading);
    expect(copy.host.querySelector('[data-probe]'), 'the child passed to WishSection').toBeInTheDocument();
  } finally { copy.finish(); }
});

test('WishList works from its props alone', async () => {
  const onToggle = spy();
  const onRemove = spy();
  const wishes = [{ id: 'w-03', name: L.bicycle, acquired: false }, { id: 'w-05', name: L.tickets, acquired: true }];
  const copy = await mount(createElement(WishList, { wishes, onToggle, onRemove }));
  try {
    expect(copy.errors, 'errors React reported for WishList without a provider').toEqual([]);
    expect(names(copy.host), 'names WishList shows').toEqual([L.bicycle, L.tickets]);
    await user.click(copy.host.querySelectorAll('li input')[0]);
    expect(onToggle, 'onToggle').toHaveBeenCalledWith('w-03');
    await user.click(copy.host.querySelectorAll('li button')[1]);
    expect(onRemove, 'onRemove').toHaveBeenCalledWith('w-05');
  } finally { copy.finish(); }
});

test('removing wishes down to one keeps the page working', async () => {
  const copy = await mount(createElement(App));
  try {
    await user.click(copy.host.querySelectorAll('li button')[0]);
    await user.click(copy.host.querySelectorAll('li button')[0]);
    expect(copy.errors, 'errors React reported after removing two wishes').toEqual([]);
    expect(names(copy.host), 'names after removing two wishes').toEqual([L.mug]);
  } finally { copy.finish(); }
});

test('addWish trims the name and ignores an empty one', async () => {
  let api = null;
  function Probe() { api = useWishes(); return createElement('p', null, api.wishes.length); }
  const copy = await mount(createElement(Probe));
  try {
    api.addWish('   ');
    await settle();
    expect(api.wishes.length, 'wishes after addWish("   ")').toBe(3);
    api.addWish(`  ${L.bicycle}  `);
    await settle();
    expect(api.wishes.length, 'wishes after adding a padded name').toBe(4);
    expect(api.wishes[3].name, 'the added name').toBe(L.bicycle);
    expect(api.wishes[3].acquired, 'acquired of the added wish').toBe(false);
  } finally { copy.finish(); }
});

test('the form adds a wish at the end of the list', async () => {
  const copy = await mount(createElement(App));
  try {
    await user.fill(copy.host.querySelector('form input'), L.tickets);
    await user.submit(copy.host.querySelector('form'));
    expect(names(copy.host), 'names after adding').toEqual([L.headphones, L.lamp, L.mug, L.tickets]);
    expect(copy.host.querySelector('form input'), 'the field after adding').toHaveValue('');
  } finally { copy.finish(); }
});
