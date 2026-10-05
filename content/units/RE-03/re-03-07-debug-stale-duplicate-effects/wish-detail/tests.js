import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Every check mounts its own copy under StrictMode, as main.jsx does, counts the keydown
// listeners that copy adds to and removes from window, and counts the requests (and the reading
// of their answers) that are still in flight, so a check can wait until every answer has arrived
// instead of guessing how long the lab takes.
async function mount() {
  const nativeFetch = window.fetch;
  let inflight = 0;
  const track = (promise) => {
    inflight += 1;
    const done = () => { inflight -= 1; };
    promise.then(done, done);
    return promise;
  };
  window.fetch = (...args) => track(nativeFetch(...args).then((response) => {
    const readJson = response.json.bind(response);
    response.json = () => track(readJson());
    return response;
  }));
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
    window.fetch = nativeFetch;
  };
  const idle = async () => {
    await waitFor(() => inflight === 0, { timeout: 3000 });
    await settle();
  };
  return { host, live, unmount, finish, idle, nativeAdd, nativeRemove };
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
    await copy.idle();
    expect(selected(copy.host), 'selected wish').toEqual(['w-02']);
    expect(detail(copy.host), 'details after both answers arrived').toBe(`${L.lamp} — 45`);
  } finally { copy.finish(); }
});

test('a cancelled request leaves no unhandled error', async () => {
  const copy = await mount();
  const rejections = [];
  const onRejection = (event) => rejections.push(event.reason?.name ?? String(event.reason));
  copy.nativeAdd.call(window, 'unhandledrejection', onRejection);
  try {
    await user.click(button(copy.host, 'w-01'));
    await user.click(button(copy.host, 'w-02'));
    await copy.idle();
    await settle();
    expect(rejections, 'unhandled promise rejections after switching from w-01 to w-02').toEqual([]);
  } finally {
    copy.nativeRemove.call(window, 'unhandledrejection', onRejection);
    copy.finish();
  }
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
