import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { settings, requests, resetServer, wishOnServer } from './fakeServer.js';

const DELAY = 250;

// Every check mounts its own copy on a fresh server and removes it afterwards.
async function mount(failNext = 0) {
  resetServer();
  settings.delayMs = DELAY;
  settings.failNext = 0;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelectorAll('input[type="checkbox"]').length === 4, { timeout: 1500 });
  settings.failNext = failNext;
  return { host, finish: () => { settings.failNext = 0; root.unmount(); host.remove(); } };
}
const box = (host, name) => [...host.querySelectorAll('label')].find((label) => label.textContent.includes(name))?.querySelector('input');
const statusText = (host) => host.querySelector('[role="status"]')?.textContent.trim() ?? null;
const answered = () => sleep(DELAY + 150);

test('the checkbox changes at once, before the server answers', async () => {
  const copy = await mount();
  try {
    await user.click(box(copy.host, L.headphones));
    expect(requests.at(-1)?.outcome, 'the PATCH request right after the click').toBe('pending');
    expect(box(copy.host, L.headphones).checked, 'the headphones checkbox right after the click').toBe(true);
  } finally { copy.finish(); }
});

test('a successful toggle stays and announces nothing', async () => {
  const copy = await mount();
  try {
    await user.click(box(copy.host, L.headphones));
    await answered();
    expect(box(copy.host, L.headphones).checked, 'the headphones checkbox after the server accepted').toBe(true);
    expect(wishOnServer('w-01').acquired, 'acquired of w-01 on the server').toBe(true);
    expect(statusText(copy.host), 'the role="status" text after a successful toggle').toBe('');
  } finally { copy.finish(); }
});

test('a successful toggle after a failure clears the message', async () => {
  const copy = await mount(1);
  try {
    await user.click(box(copy.host, L.headphones));
    await answered();
    await user.click(box(copy.host, L.lamp));
    await answered();
    expect(box(copy.host, L.lamp).checked, 'the lamp checkbox after its change succeeded').toBe(true);
    expect(statusText(copy.host), 'the role="status" text after a failed toggle and then a successful one').toBe('');
  } finally { copy.finish(); }
});

test('a failed toggle puts the wish back', async () => {
  const copy = await mount(1);
  try {
    await user.click(box(copy.host, L.headphones));
    await answered();
    expect(box(copy.host, L.headphones).checked, 'the headphones checkbox after the server failed').toBe(false);
  } finally { copy.finish(); }
});

test('a failed toggle announces which wish failed', async () => {
  const copy = await mount(1);
  try {
    await user.click(box(copy.host, L.headphones));
    await answered();
    expect(statusText(copy.host), 'the role="status" text after a failed toggle').toBe(L.toggleFailed.replace('{name}', L.headphones));
  } finally { copy.finish(); }
});

test('a failed toggle of an acquired wish puts it back to acquired', async () => {
  const copy = await mount(1);
  try {
    await user.click(box(copy.host, L.book));
    await answered();
    expect(box(copy.host, L.book).checked, 'the book checkbox (acquired before the click) after the server failed').toBe(true);
  } finally { copy.finish(); }
});

test('rollback keeps a change made while the request was pending', async () => {
  const copy = await mount(1);
  try {
    await user.click(box(copy.host, L.headphones));
    await sleep(60);
    await user.click(box(copy.host, L.lamp));
    await answered();
    await sleep(100);
    expect(box(copy.host, L.headphones).checked, 'the headphones checkbox (its change failed)').toBe(false);
    expect(box(copy.host, L.lamp).checked, 'the lamp checkbox (its change succeeded)').toBe(true);
  } finally { copy.finish(); }
});
