import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Every check mounts its own copy under StrictMode, as main.jsx does, and counts the keydown
// listeners that copy adds to and removes from window.
async function mount() {
  const nativeAdd = window.addEventListener;
  const nativeRemove = window.removeEventListener;
  const live = new Set();
  window.addEventListener = function (type, listener, options) {
    if (type === 'keydown') {
      live.add(listener);
      options?.signal?.addEventListener('abort', () => live.delete(listener));
    }
    return nativeAdd.call(this, type, listener, options);
  };
  window.removeEventListener = function (type, listener, options) {
    if (type === 'keydown') live.delete(listener);
    return nativeRemove.call(this, type, listener, options);
  };
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(StrictMode, null, createElement(App)));
  await waitFor(() => host.querySelector('p') !== null);
  await settle();
  let mounted = true;
  const unmount = () => { if (mounted) { mounted = false; root.unmount(); } };
  const finish = () => {
    unmount();
    for (const listener of live) nativeRemove.call(window, 'keydown', listener);
    host.remove();
    window.addEventListener = nativeAdd;
    window.removeEventListener = nativeRemove;
  };
  return { host, live, unmount, finish };
}
const button = (host, id) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === id);
const detail = (host) => host.querySelector('p').textContent;
const selected = (host) => [...host.querySelectorAll('button')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent.trim());

test('selecting a wish shows its details', async () => {
  const copy = await mount();
  try {
    await user.click(button(copy.host, 'w-02'));
    await waitFor(() => detail(copy.host).startsWith(L.lamp), { timeout: 1500 });
    expect(detail(copy.host), 'details after selecting w-02').toBe(`${L.lamp} — 45`);
    await user.click(button(copy.host, 'w-03'));
    await waitFor(() => detail(copy.host).startsWith(L.bike), { timeout: 1500 });
    expect(detail(copy.host), 'details after selecting w-03').toBe(`${L.bike} — 240`);
  } finally { copy.finish(); }
});

test('a slow answer for an earlier selection does not replace the current one', async () => {
  const copy = await mount();
  try {
    await user.click(button(copy.host, 'w-01'));
    await user.click(button(copy.host, 'w-02'));
    await sleep(1300);
    expect(selected(copy.host), 'selected wish').toEqual(['w-02']);
    expect(detail(copy.host), 'details 1.3 s after switching from w-01 to w-02').toBe(`${L.lamp} — 45`);
  } finally { copy.finish(); }
});

test('the j key moves the selection by exactly one wish', async () => {
  const copy = await mount();
  try {
    await user.click(button(copy.host, 'w-01'));
    await user.press('j', copy.host.querySelector('button'));
    expect(selected(copy.host), 'selected wish after one j').toEqual(['w-02']);
  } finally { copy.finish(); }
});

test('after mounting exactly one key listener is attached', async () => {
  const copy = await mount();
  try {
    expect(copy.live.size, 'keydown listeners on window after mounting under StrictMode').toBe(1);
  } finally { copy.finish(); }
});

test('unmounting removes the key listener', async () => {
  const copy = await mount();
  try {
    copy.unmount();
    expect(copy.live.size, 'keydown listeners on window after unmounting').toBe(0);
  } finally { copy.finish(); }
});
