import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setSaveStatus } from './saveStatus.js';

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
    await waitFor(() => host.querySelector('p') !== null);
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
const label = (host) => host.querySelector('p').textContent;
const expected = (status) => `${L.lastSaved} ${status}`;
const taskButton = (host, title) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === title);

test('the label shows the status of the selected task', async () => {
  const copy = await mount();
  try {
    await pass(copy, 200);
    expect(label(copy.host), 'label one interval step (200 ms) after the first display').toBe(expected(L.justNow));
  } finally { copy.finish(); }
});

test('the label refreshes when the saved status changes', async () => {
  const copy = await mount();
  try {
    await pass(copy, 200);
    setSaveStatus('t-01', L.oneMinute);
    await pass(copy, 200);
    expect(label(copy.host), 'label one step after the status of t-01 changed').toBe(expected(L.oneMinute));
  } finally { setSaveStatus('t-01', L.justNow); copy.finish(); }
});

test('selecting another task shows that task\'s status', async () => {
  const copy = await mount();
  try {
    await user.click(taskButton(copy.host, L.library));
    await pass(copy, 200);
    expect(label(copy.host), 'label one step after selecting the second task').toBe(expected(L.fiveMinutes));
    await user.click(taskButton(copy.host, L.grandma));
    await pass(copy, 200);
    expect(label(copy.host), 'label one step after selecting the third task').toBe(expected(L.never));
  } finally { copy.finish(); }
});

test('only one interval is running after switching tasks', async () => {
  const copy = await mount();
  try {
    await user.click(taskButton(copy.host, L.library));
    await user.click(taskButton(copy.host, L.grandma));
    expect(copy.clock.liveIntervals(), 'intervals still running after two switches').toBe(1);
  } finally { copy.finish(); }
});

test('unmounting stops the interval', async () => {
  const copy = await mount();
  try {
    await user.click(taskButton(copy.host, L.library));
    copy.unmount();
    expect(copy.clock.liveIntervals(), 'intervals still running after unmount').toBe(0);
  } finally { copy.finish(); }
});

test('the interval restarts only when the selected task changes', async () => {
  const copy = await mount();
  try {
    await pass(copy, 450);
    await user.click(taskButton(copy.host, L.library));
    await pass(copy, 450);
    await user.click(taskButton(copy.host, L.grandma));
    await pass(copy, 450);
    expect(copy.clock.counts.intervalsStarted, 'intervals started: one on mount, one per switch').toBe(3);
  } finally { copy.finish(); }
});
