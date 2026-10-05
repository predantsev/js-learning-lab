import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { savedTitles } from './drafts.js';

// A fake clock: while a check runs, setTimeout and setInterval only record timers, and the check
// moves time forward itself. No check waits for real time, and none depends on how fast the
// computer is. clearTimeout/clearInterval are replaced too, so a fake id never clears a real timer.
function useFakeClock() {
  const real = {
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
  };
  const timers = [];
  const counts = { intervalsStarted: 0 };
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
  window.setInterval = (fn, ms = 0, ...args) => { counts.intervalsStarted += 1; return add(fn, ms, args, true); };
  window.clearTimeout = remove;
  window.clearInterval = remove;
  return {
    counts,
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
    restore() {
      Object.assign(window, real);
    },
  };
}

// Every check mounts its own copy on the fake clock and counts the intervals that copy starts and clears.
async function mount() {
  const clock = useFakeClock();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  let mounted = true;
  const unmount = () => { if (mounted) { mounted = false; root.unmount(); } };
  const finish = () => { unmount(); host.remove(); clock.restore(); };
  try {
    await waitFor(() => host.querySelector('input') !== null);
    await settle();
  } catch (error) { finish(); throw error; }
  return { host, clock, unmount, finish };
}
// Moves the fake time forward in small steps and lets React show each change.
async function pass(copy, ms) {
  for (let step = 0; step < ms; step += 50) {
    copy.clock.advance(50);
    await settle();
  }
}
const notice = (host) => host.querySelector('p').textContent;

test('the notice shows the title that was saved', async () => {
  const copy = await mount();
  try {
    await pass(copy, 400);
    expect(notice(copy.host), 'notice one timer step (400 ms) after the first display').toBe(`${L.savedPrefix} ${L.initialTitle}`);
  } finally { copy.finish(); }
});

test('the timer saves the latest typed title', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('input'), L.extra);
    await pass(copy, 400);
    expect(savedTitles(), 'titles passed to saveDraft').toContain(`${L.initialTitle}${L.extra}`);
    expect(notice(copy.host), 'notice after typing').toBe(`${L.savedPrefix} ${L.initialTitle}${L.extra}`);
  } finally { copy.finish(); }
});

test('typing does not restart the timer', async () => {
  const copy = await mount();
  try {
    await user.type(copy.host.querySelector('input'), L.extra);
    await pass(copy, 400);
    expect(copy.clock.counts.intervalsStarted, 'intervals started while typing several characters').toBe(1);
  } finally { copy.finish(); }
});

test('unmounting stops the timer', async () => {
  const copy = await mount();
  try {
    await pass(copy, 400);
    copy.unmount();
    expect(copy.clock.liveIntervals(), 'intervals still running after unmount').toBe(0);
  } finally { copy.finish(); }
});
