import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { settings, requests } from './fixtureApi.js';

const DELAY = 120;

// Every check mounts its own copy of the list and removes it afterwards.
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.childNodes.length > 0);
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const labels = (host) => [...host.querySelectorAll('li')].map((li) => li.textContent.trim());
const statusText = (host) => host.querySelector('[role="status"]')?.textContent.trim() ?? null;
const button = (host) => host.querySelector('button');
const ALL = () => [L.groceries, L.transit, L.coffee, L.bulbs];
const failedText = (attempt) => L.failed.replace('{attempt}', String(attempt));
const answered = () => sleep(DELAY + 120);

function prepare(failNext = 0) {
  settings.delayMs = DELAY;
  settings.failNext = failNext;
}

test('the first load lists the expenses', async () => {
  prepare();
  const copy = await mount();
  try {
    await answered();
    expect(labels(copy.host), 'list items after the first answer').toEqual(ALL());
    expect(statusText(copy.host), 'the role="status" text after the first answer').toBe('');
  } finally { copy.finish(); }
});

test('a failed refresh keeps the earlier list and announces the failure', async () => {
  prepare();
  const copy = await mount();
  try {
    await answered();
    settings.failNext = 1;
    await user.click(button(copy.host));
    await answered();
    expect(labels(copy.host), 'list items after a failed refresh').toEqual(ALL());
    expect(statusText(copy.host), 'the role="status" text after a failed refresh').toBe(failedText(1));
  } finally { settings.failNext = 0; copy.finish(); }
});

test('the button is disabled while a request is pending', async () => {
  prepare();
  const copy = await mount();
  try {
    await answered();
    const before = requests.length;
    await user.click(button(copy.host));
    expect(button(copy.host)?.disabled ?? null, 'the button right after a click').toBe(true);
    await user.click(button(copy.host));
    await answered();
    expect(requests.length - before, 'requests sent by two quick clicks').toBe(1);
  } finally { copy.finish(); }
});

test('try again after a failure loads the list', async () => {
  prepare(1);
  const copy = await mount();
  try {
    await answered();
    const retry = button(copy.host);
    expect(retry?.textContent.trim() ?? null, 'the button after the first load failed').toBe(L.tryAgain);
    await user.click(retry);
    await answered();
    expect(labels(copy.host), 'list items after Try again').toEqual(ALL());
    expect(statusText(copy.host), 'the role="status" text after a successful Try again').toBe('');
  } finally { settings.failNext = 0; copy.finish(); }
});

test('three failed attempts stop the retries', async () => {
  prepare(10);
  const before = requests.length;
  const copy = await mount();
  try {
    await answered();
    for (let attempt = 2; attempt <= 3; attempt += 1) {
      const retry = button(copy.host);
      if (retry && !retry.disabled) await user.click(retry);
      await answered();
    }
    const retry = button(copy.host);
    if (retry && !retry.disabled) await user.click(retry);
    await answered();
    expect(requests.length - before, 'requests sent in total (the first load and every Try again)').toBe(3);
    expect(button(copy.host)?.disabled ?? true, 'the button after three failed attempts is disabled or gone').toBe(true);
    expect(statusText(copy.host), 'the role="status" text after three failed attempts').toBe(L.giveUp);
  } finally { settings.failNext = 0; copy.finish(); }
});

test('the status region stays the same element from the first render', async () => {
  prepare(1);
  const copy = await mount();
  try {
    const region = copy.host.querySelector('[role="status"]');
    expect(region !== null, 'a role="status" element on the first render').toBe(true);
    await answered();
    expect(copy.host.querySelector('[role="status"]') === region, 'the same role="status" element after a failure').toBe(true);
  } finally { settings.failNext = 0; copy.finish(); }
});
