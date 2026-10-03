import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { savedTitles } from './drafts.js';

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
  await waitFor(() => host.querySelector('input') !== null);
  let mounted = true;
  const unmount = () => { if (mounted) { mounted = false; root.unmount(); } };
  const finish = () => { for (const id of [...live]) nativeClear(id); unmount(); host.remove(); restore(); };
  return { host, unmount, live, counts, finish };
}
const notice = (host) => host.querySelector('p').textContent;

test('the notice shows the title that was saved', async () => {
  const copy = await mount();
  try {
    await sleep(500);
    expect(notice(copy.host), 'notice 500 ms after the first display').toBe(`${L.savedPrefix} ${L.initialTitle}`);
  } finally { copy.finish(); }
});

test('the timer saves the latest typed title', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('input'), L.extra);
    await sleep(500);
    expect(savedTitles(), 'titles passed to saveDraft').toContain(`${L.initialTitle}${L.extra}`);
    expect(notice(copy.host), 'notice after typing').toBe(`${L.savedPrefix} ${L.initialTitle}${L.extra}`);
  } finally { copy.finish(); }
});

test('typing does not restart the timer', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('input'), L.extra);
    await sleep(100);
    expect(copy.counts.started, 'intervals started while typing several characters').toBe(1);
  } finally { copy.finish(); }
});

test('unmounting stops the timer', async () => {
  const copy = await mount();
  try {
    await sleep(50);
    copy.unmount();
    expect(copy.live.size, 'intervals still running after unmount').toBe(0);
  } finally { copy.finish(); }
});
