import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReadingProgress } from './ReadingProgress.jsx';

// Every check mounts its own copy under StrictMode, as main.jsx does, with its own onSave spy and
// its own starting total, and presses the buttons like a person.
async function mount(initialPages) {
  const saves = [];
  const onSave = (body) => saves.push(body);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(StrictMode, null, createElement(ReadingProgress, { memberId: 'm-04', bookId: 'b-03', initialPages, onSave })));
  await waitFor(() => host.querySelector('p'));
  return {
    saves,
    shown: () => Number(host.querySelector('p').textContent.split(':').at(-1).trim()),
    press: async (label) => {
      await user.click([...host.querySelectorAll('button')].find((button) => button.textContent === label));
      await settle();
    },
    finish: () => { root.unmount(); host.remove(); },
  };
}

test('one press saves the total the page now shows', async () => {
  const copy = await mount(12);
  try {
    await copy.press('+10');
    expect(copy.shown(), 'the total on the page').toBe(22);
    expect(copy.saves.at(-1), 'the last body sent to onSave').toEqual({ memberId: 'm-04', bookId: 'b-03', pages: 22 });
  } finally { copy.finish(); }
});

test('two presses save 37 and then 47', async () => {
  const copy = await mount(12);
  try {
    await copy.press('+25');
    await copy.press('+10');
    expect(copy.shown(), 'the total on the page').toBe(47);
    expect(copy.saves.map((body) => body.pages), 'pages of every body sent to onSave').toEqual([37, 47]);
  } finally { copy.finish(); }
});

test('nothing is saved before the first press', async () => {
  const copy = await mount(12);
  try {
    await settle();
    expect(copy.saves, 'bodies sent to onSave right after the page appeared').toEqual([]);
  } finally { copy.finish(); }
});
