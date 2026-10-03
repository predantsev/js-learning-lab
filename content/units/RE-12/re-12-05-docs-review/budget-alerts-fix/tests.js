import { StrictMode, createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import BudgetAlerts from './BudgetAlerts';
import { budgetFeed } from './budgetFeed.js';
import { releaseNote } from './releaseNotes.js';

// Mounts BudgetAlerts in StrictMode in a fresh container, as main.jsx does.
async function mount() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  flushSync(() => root.render(createElement(StrictMode, null, createElement(BudgetAlerts))));
  await settle();
  return { container, unmount: () => { flushSync(() => root.unmount()); container.remove(); } };
}

test('each budget alert is shown once', async () => {
  const { container, unmount } = await mount();
  try {
    budgetFeed.emit({ id: 'transport-oct', category: L.transport, overMinor: 4000 });
    await settle();
    const rows = [...container.querySelectorAll('li')].filter((li) => li.textContent.includes(L.transport));
    expect(rows.length, `rows for one "${L.transport}" alert`).toBe(1);
  } finally {
    unmount();
  }
});

test('no subscription is left after the alerts are removed from the page', async () => {
  const before = budgetFeed.listenerCount();
  const { unmount } = await mount();
  unmount();
  await settle();
  expect(budgetFeed.listenerCount() - before, 'subscriptions left after mounting and removing BudgetAlerts').toBe(0);
});

const CODE_WORDS = ['useeffect', 'cleanup', 'clean-up', 'subscribe', 'listener', 'strictmode', 'effect', 'react', '`'];

test('the release note is a sentence for people, without code words', () => {
  const text = typeof releaseNote?.text === 'string' ? releaseNote.text.trim() : '';
  expect(text.length >= 20, `release note length (got ${text.length} characters)`).toBe(true);
  expect(text.length <= 240, `release note length (got ${text.length} characters)`).toBe(true);
  const found = CODE_WORDS.filter((word) => text.toLowerCase().includes(word));
  expect(found, 'code words in the release note').toEqual([]);
  expect(releaseNote.version, 'releaseNote.version').toBe('0.4.1');
});
