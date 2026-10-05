// A fake clock: while a check runs, setTimeout and setInterval only record timers, and the check
// moves time forward itself. No check waits for real seconds, and none depends on how fast the
// computer is. clearTimeout/clearInterval are replaced too, so a fake id never clears a real timer.
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
    pending: () => timers.length,
    restore() {
      Object.assign(window, real);
    },
  };
}

// Runs countdown(from) on the fake clock and returns what it printed after each step of time.
function printedDuring(from, steps) {
  const clock = useFakeClock();
  const start = logs().length;
  const seen = [];
  try {
    scope.countdown(from);
    for (const ms of steps) {
      clock.advance(ms);
      seen.push(logs().slice(start));
    }
    return { seen, pending: clock.pending() };
  } finally {
    clock.restore();
  }
}

test('prints the start number without waiting', () => {
  const { seen } = printedDuring(3, [0]);
  expect(seen[0], 'printed right after countdown(3)').toEqual(['3']);
});

test('waits one second before the next number', () => {
  const { seen } = printedDuring(3, [0, 999, 1]);
  expect(seen[1], 'printed after 999 ms').toEqual(['3']);
  expect(seen[2], 'printed after 1000 ms').toEqual(['3', '2']);
});

test('counts down to 1 and stops', () => {
  const { seen, pending } = printedDuring(3, [10000]);
  expect(seen[0], 'printed after 10 seconds').toEqual(['3', '2', '1']);
  expect(pending, 'timers still waiting after the countdown').toBe(0);
});

test('works for any start number', () => {
  const { seen } = printedDuring(5, [0, 1000, 1000, 1000, 1000]);
  expect(seen[4], 'printed by countdown(5) after 4 seconds').toEqual(['5', '4', '3', '2', '1']);
  expect(seen[1], 'printed by countdown(5) after 1 second').toEqual(['5', '4']);
});
