import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { cardRenders } from './WishCard';

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
const card = (host, index) => host.querySelectorAll('li')[index];
const nameIn = (li) => li.querySelector('span').textContent;
const button = (li, text) => [...li.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
const newWishField = (host) => host.querySelector('form input');
const sortBox = (host) => [...host.querySelectorAll('label > input[type="checkbox"]')][0];

test('typing a new wish name renders no cards', async () => {
  const copy = await mount();
  try {
    const before = cardRenders();
    await user.type(newWishField(copy.host), 'ab');
    expect(cardRenders() - before, 'WishCard renders while typing two letters').toBe(0);
  } finally { copy.finish(); }
});

test('selecting a wish marks exactly that card', async () => {
  const copy = await mount();
  try {
    await user.click(button(card(copy.host, 2), L.select));
    await user.click(button(card(copy.host, 4), L.select));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(button(card(copy.host, 4), L.select), 'Select of the fifth card').toHaveAttribute('aria-pressed', 'true');
    expect(button(card(copy.host, 2), L.select), 'Select of the third card').toHaveAttribute('aria-pressed', 'false');
  } finally { copy.finish(); }
});

test('an open price editor stays with its wish after sorting', async () => {
  const copy = await mount();
  try {
    const first = card(copy.host, 0);
    const name = nameIn(first);
    await user.click(button(first, L.editPrice));
    await user.click(sortBox(copy.host));
    const withEditor = [...copy.host.querySelectorAll('li')].filter((li) => li.querySelector('form'));
    expect(withEditor.length, 'cards with an open editor after sorting').toBe(1);
    expect(nameIn(withEditor[0]), 'the wish whose editor is open after sorting').toBe(name);
  } finally { copy.finish(); }
});

test('Escape closes the editor and returns focus to its Edit button', async () => {
  const copy = await mount();
  try {
    const third = card(copy.host, 2);
    button(third, L.editPrice).focus();
    await user.press('Enter', button(third, L.editPrice));
    const input = card(copy.host, 2).querySelector('input');
    expect(input, 'the price field after Enter').toHaveFocus();
    await user.press('Escape', input);
    expect(button(card(copy.host, 2), L.editPrice), 'Edit price of the third card').toHaveFocus();
  } finally { copy.finish(); }
});

test('Enter saves the new price', async () => {
  const copy = await mount();
  try {
    await user.click(button(card(copy.host, 1), L.editPrice));
    await user.fill(card(copy.host, 1).querySelector('input'), '35');
    await user.press('Enter', card(copy.host, 1).querySelector('input'));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(card(copy.host, 1), 'the second card after saving').toHaveTextContent(`35 ${L.currency}`);
  } finally { copy.finish(); }
});
