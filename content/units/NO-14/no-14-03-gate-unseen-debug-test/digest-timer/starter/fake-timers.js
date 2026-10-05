// A fake clock for the demo and the checks (read-only): setInterval and clearInterval that only
// record timers, and advance(ms), which moves time and runs every interval that falls due, in order.
// Ids are "fake-N", so they never reach a real timer. Only the interval family is faked: the
// digest needs nothing else.
export function fakeTimers() {
  let now = 0;
  let nextId = 1;
  const live = new Map();
  return {
    setInterval(fn, ms) {
      const id = `fake-${nextId++}`;
      live.set(id, { fn, every: Math.max(1, Number(ms) || 0), due: now + Math.max(1, Number(ms) || 0) });
      return id;
    },
    clearInterval(id) {
      live.delete(id);
    },
    liveCount: () => live.size,
    now: () => now,
    advance(ms) {
      const end = now + ms;
      for (;;) {
        let next = null;
        for (const timer of live.values()) if (timer.due <= end && (next === null || timer.due < next.due)) next = timer;
        if (next === null) break;
        now = next.due;
        next.due += next.every;
        next.fn();
      }
      now = end;
    },
  };
}
