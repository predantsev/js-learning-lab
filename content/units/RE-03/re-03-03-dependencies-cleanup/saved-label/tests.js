import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setSaveStatus } from './saveStatus.js';

// Every check mounts its own copy and counts the intervals that copy starts and clears.
async function mount() {
  const nativeSet = window.setInterval;
  const nativeClear = window.clearInterval;
  const live = new Set();
  const counts = { started: 0 };
  window.setInterval = (...args) => { const id = nativeSet(...args); counts.started += 1; live.add(id); return id; };
  window.clearInterval = (id) => { live.delete(id); nativeClear(id); };
  const restore = () => { window.setInterval = nativeSet; window.clearInterval = nativeClear; };
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('p') !== null);
  let mounted = true;
  const unmount = () => { if (mounted) { mounted = false; root.unmount(); } };
  const finish = () => { for (const id of [...live]) nativeClear(id); unmount(); host.remove(); restore(); };
  return { host, unmount, live, counts, restore, finish };
}
const label = (host) => host.querySelector('p').textContent;
const expected = (status) => `${L.lastSaved} ${status}`;
const taskButton = (host, title) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === title);

test('the label shows the status of the selected task', async () => {
  const copy = await mount();
  try {
    await sleep(320);
    expect(label(copy.host), 'label 320 ms after the first display').toBe(expected(L.justNow));
  } finally { copy.finish(); }
});

test('the label refreshes when the saved status changes', async () => {
  const copy = await mount();
  try {
    await sleep(320);
    setSaveStatus('t-01', L.oneMinute);
    await sleep(320);
    expect(label(copy.host), 'label after the status of t-01 changed').toBe(expected(L.oneMinute));
  } finally { setSaveStatus('t-01', L.justNow); copy.finish(); }
});

test('selecting another task shows that task\'s status', async () => {
  const copy = await mount();
  try {
    await user.click(taskButton(copy.host, L.library));
    await sleep(320);
    expect(label(copy.host), 'label after selecting the second task').toBe(expected(L.fiveMinutes));
    await user.click(taskButton(copy.host, L.grandma));
    await sleep(320);
    expect(label(copy.host), 'label after selecting the third task').toBe(expected(L.never));
  } finally { copy.finish(); }
});

test('only one interval is running after switching tasks', async () => {
  const copy = await mount();
  try {
    await user.click(taskButton(copy.host, L.library));
    await user.click(taskButton(copy.host, L.grandma));
    await sleep(50);
    expect(copy.live.size, 'intervals still running after two switches').toBe(1);
  } finally { copy.finish(); }
});

test('unmounting stops the interval', async () => {
  const copy = await mount();
  try {
    await user.click(taskButton(copy.host, L.library));
    copy.unmount();
    expect(copy.live.size, 'intervals still running after unmount').toBe(0);
  } finally { copy.finish(); }
});

test('the interval restarts only when the selected task changes', async () => {
  const copy = await mount();
  try {
    await sleep(450);
    await user.click(taskButton(copy.host, L.library));
    await sleep(450);
    await user.click(taskButton(copy.host, L.grandma));
    await sleep(450);
    expect(copy.counts.started, 'intervals started: one on mount, one per switch').toBe(3);
  } finally { copy.finish(); }
});
