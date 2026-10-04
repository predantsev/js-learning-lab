import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ExpenseList } from './ExpenseList.jsx';

// The checks mount their own lists for the categories "home" and "transport" (the page itself
// shows "food"), on a fake clock and a fake server they answer by hand.
const MINE = ['home', 'transport'];
const DATA = {
  home: [{ id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home' }],
  transport: [{ id: 'e-02', label: L.transit, amountMinor: 52000, date: '2026-03-01', category: 'transport' }],
};

// A fake clock: setTimeout/setInterval only record timers, and the check moves time itself.
// clearTimeout/clearInterval are replaced too, so a fake id never clears a real timer.
function useFakeClock() {
  const real = { setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, setInterval: window.setInterval, clearInterval: window.clearInterval };
  const timers = [];
  let now = 0;
  let nextId = 1;
  const add = (fn, ms, args, repeat) => {
    const id = `fake-${nextId++}`;
    const wait = Math.max(0, Number(ms) || 0);
    timers.push({ id, seq: nextId, at: now + wait, fn, args, every: repeat ? Math.max(1, wait) : null });
    return id;
  };
  const remove = (id) => {
    const index = timers.findIndex((timer) => timer.id === id);
    if (index !== -1) timers.splice(index, 1);
    else real.clearTimeout(id);
  };
  window.setTimeout = (fn, ms = 0, ...args) => add(fn, ms, args, false);
  window.setInterval = (fn, ms = 0, ...args) => add(fn, ms, args, true);
  window.clearTimeout = remove;
  window.clearInterval = remove;
  return {
    advance(ms) {
      const end = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at || a.seq - b.seq);
        const next = timers[0];
        if (!next || next.at > end) break;
        timers.shift();
        now = next.at;
        if (next.every !== null) timers.push({ ...next, seq: nextId++, at: now + next.every });
        if (typeof next.fn === 'function') next.fn(...next.args);
      }
      now = end;
    },
    liveIntervals: () => timers.filter((timer) => timer.every !== null).length,
    restore: () => Object.assign(window, real),
  };
}

// A fake server for the checks' categories: every request is recorded and answered by hand.
// Like fetch, it rejects with an AbortError when the request's signal aborts, and sends nothing
// for a signal that is already aborted.
function useFakeServer() {
  const realFetch = window.fetch;
  const requests = [];
  window.fetch = (input, init = {}) => {
    const category = new URL(String(input), window.location.href).searchParams.get('category');
    if (!MINE.includes(category)) return new Promise(() => {}); // the page's own list: never answered during a check
    if (init.signal?.aborted) return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    return new Promise((resolve, reject) => {
      const request = { category, open: true };
      request.answer = () => {
        if (!request.open) return;
        request.open = false;
        resolve(new Response(JSON.stringify(DATA[category]), { status: 200, headers: { 'content-type': 'application/json' } }));
      };
      init.signal?.addEventListener('abort', () => {
        if (!request.open) return;
        request.open = false;
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
      requests.push(request);
    });
  };
  return { requests, restore: () => { window.fetch = realFetch; } };
}

async function mount(category) {
  const clock = useFakeClock();
  const server = useFakeServer();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let mounted = true;
  const show = async (next) => {
    root.render(createElement(ExpenseList, { category: next }));
    await settle();
  };
  const close = async () => {
    if (mounted) { mounted = false; root.unmount(); }
    await settle();
  };
  const finish = () => { if (mounted) { mounted = false; root.unmount(); } host.remove(); server.restore(); clock.restore(); };
  try { await show(category); } catch (error) { finish(); throw error; }
  return { host, clock, server, show, close, finish };
}
// Answers every open request, then lets React show the result.
async function answerAll(copy) {
  for (const request of copy.server.requests) request.answer();
  await settle();
}
async function pass(copy, ms) {
  for (let step = 0; step < ms; step += 500) { copy.clock.advance(500); await settle(); }
}
const items = (host) => [...host.querySelectorAll('li')].map((li) => li.textContent);

test('the list shows the expenses of its category', async () => {
  const copy = await mount('home');
  try {
    expect(copy.server.requests.length, 'requests right after the list appeared').toBe(1);
    await answerAll(copy);
    expect(items(copy.host), 'list items after the first answer').toEqual([`${L.bulbs} — 99.90`]);
  } finally { copy.finish(); }
});

test('while shown, it asks the server again every 3 seconds', async () => {
  const copy = await mount('home');
  try {
    await answerAll(copy);
    await pass(copy, 3000);
    await answerAll(copy);
    await pass(copy, 3000);
    expect(copy.server.requests.map((r) => r.category), 'requests after 6 seconds').toEqual(['home', 'home', 'home']);
  } finally { copy.finish(); }
});

test('after the list is closed, no request reaches the server and no timer is left', async () => {
  const copy = await mount('home');
  try {
    await answerAll(copy);
    await copy.close();
    const before = copy.server.requests.length;
    await pass(copy, 9000);
    expect(copy.server.requests.length - before, 'requests in 9 seconds after closing').toBe(0);
    expect(copy.clock.liveIntervals(), 'intervals still running after closing').toBe(0);
  } finally { copy.finish(); }
});

test('after switching category, only the new category is polled', async () => {
  const copy = await mount('home');
  try {
    await answerAll(copy);
    const before = copy.server.requests.length;
    await copy.show('transport');
    await answerAll(copy);
    await pass(copy, 6000);
    expect(copy.server.requests.slice(before).map((r) => r.category), 'requests in 6 seconds after the switch').toEqual(['transport', 'transport', 'transport']);
    expect(copy.clock.liveIntervals(), 'intervals running after the switch').toBe(1);
  } finally { copy.finish(); }
});

test('a late answer for the old category does not replace the new list', async () => {
  const copy = await mount('home');
  try {
    const old = copy.server.requests[0];
    await copy.show('transport');
    const fresh = copy.server.requests.find((r) => r.category === 'transport');
    expect(fresh, 'a request for "transport" after the switch').toBeDefined();
    fresh.answer();
    await settle();
    old.answer(); // the old category's answer arrives late
    await settle();
    expect(items(copy.host), 'list items after the late answer').toEqual([`${L.transit} — 520.00`]);
  } finally { copy.finish(); }
});
