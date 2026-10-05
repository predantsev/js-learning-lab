import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { RecordsScreen } from './RecordsScreen';
import { setNextOutcome } from './tasksApi';

// A fake clock: while a check runs, the fake server's 300 ms timer is only recorded, and the check
// moves time forward itself, so no check depends on how fast the computer is.
function useFakeClock() {
  const real = {
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
  };
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
    restore() {
      Object.assign(window, real);
    },
  };
}

// Every check mounts its own screen on the fake clock; the fake server answers when the check moves time 300 ms on.
async function mount(outcome) {
  setNextOutcome(outcome);
  const clock = useFakeClock();
  const onCreate = spy();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(RecordsScreen, { onCreate }));
  await waitFor(() => host.childElementCount > 0);
  await settle();
  return {
    host,
    onCreate,
    status: () => host.querySelector('[role="status"]'),
    statusText: () => host.querySelector('[role="status"]')?.textContent.trim() ?? '(no role="status" element)',
    items: () => [...host.querySelectorAll('li')].map((li) => li.textContent),
    button: (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text),
    buttons: () => host.querySelectorAll('button').length,
    finish: () => { root.unmount(); host.remove(); clock.restore(); setNextOutcome('ok'); },
    clock,
  };
}
// Lets the fake server answer, then lets React show the result.
async function settled(copy) {
  copy.clock.advance(300);
  await sleep(0);
  await settle();
}

test('while loading only the loading status is shown', async () => {
  const copy = await mount('ok');
  try {
    expect(copy.statusText(), 'status text right after mounting').toBe(L.loading);
    expect(copy.items(), 'list items while loading').toEqual([]);
    expect(copy.buttons(), 'buttons while loading').toBe(0);
  } finally { copy.finish(); }
});

test('a successful load shows the count and the tasks', async () => {
  const copy = await mount('ok');
  try {
    await settled(copy);
    expect(copy.statusText(), 'status text after loading').toBe(`${L.loaded} 3`);
    expect(copy.items(), 'list items').toEqual([L.plants, L.library, L.dentist]);
  } finally { copy.finish(); }
});

test('an empty load shows the empty status and a create action', async () => {
  const copy = await mount('empty');
  try {
    await settled(copy);
    expect(copy.statusText(), 'status text for an empty list').toBe(L.noTasks);
    expect(copy.items(), 'list items').toEqual([]);
    const create = copy.button(L.createFirst);
    expect(create, `a button "${L.createFirst}"`).toBeDefined();
    await user.click(create);
    expect(copy.onCreate, 'onCreate').toHaveBeenCalledTimes(1);
  } finally { copy.finish(); }
});

test('a failed load shows its own message and a retry that loads again', async () => {
  const copy = await mount('fail');
  try {
    await settled(copy);
    expect(copy.statusText(), 'status text after a failure').toBe(L.loadFailed);
    expect(copy.button(L.createFirst), 'a create button on the error state').toBeUndefined();
    const retry = copy.button(L.retry);
    expect(retry, `a button "${L.retry}"`).toBeDefined();
    setNextOutcome('ok');
    await user.click(retry);
    await settle();
    expect(copy.statusText(), 'status text right after Retry').toBe(L.loading);
    await settled(copy);
    expect(copy.items(), 'list items after a successful retry').toEqual([L.plants, L.library, L.dentist]);
  } finally { copy.finish(); }
});

test('the status element stays the same element in every state', async () => {
  const copy = await mount('fail');
  try {
    const first = copy.status();
    expect(first, 'a role="status" element while loading').not.toBeNull();
    await settled(copy);
    expect(copy.status() === first, 'the role="status" element after the failure is the one from loading').toBe(true);
    setNextOutcome('ok');
    await user.click(copy.button(L.retry));
    await settled(copy);
    expect(copy.status() === first, 'the role="status" element after the retry is still the same').toBe(true);
  } finally { copy.finish(); }
});
