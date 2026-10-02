// A fake clock: while a check runs, setTimeout only records timers, and the check moves time
// forward itself. No check waits for real seconds.
function useFakeClock() {
  const realSetTimeout = window.setTimeout;
  const timers = [];
  let now = 0;
  let nextId = 1;
  window.setTimeout = (fn, ms = 0, ...args) => {
    const id = nextId++;
    timers.push({ id, at: now + Math.max(0, Number(ms) || 0), fn, args });
    return id;
  };
  return {
    advance(ms) {
      const end = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at || a.id - b.id);
        const next = timers[0];
        if (!next || next.at > end) break;
        timers.shift();
        now = next.at;
        if (typeof next.fn === 'function') next.fn(...next.args);
      }
      now = end;
    },
    restore() {
      window.setTimeout = realSetTimeout;
    },
  };
}

// Lets every waiting promise callback run (a real 0 ms pause, not the fake clock).
const flush = () => sleep(0);

// Watches a promise: `state.done` becomes true and `state.value` is set once it is fulfilled.
function watch(promise) {
  const state = { done: false, value: undefined };
  promise.then((value) => {
    state.done = true;
    state.value = value;
  });
  return state;
}

test('delay returns a promise', () => {
  const clock = useFakeClock();
  try {
    expect(scope.delay(10, 'x') instanceof Promise, 'delay(10, "x") is a promise').toBe(true);
  } finally {
    clock.restore();
  }
});

test('the promise waits the given time before it is fulfilled', async () => {
  const clock = useFakeClock();
  try {
    const state = watch(scope.delay(1000, 'w-03'));
    clock.advance(999);
    await flush();
    expect(state.done, 'fulfilled after 999 ms').toBe(false);
    clock.advance(1);
    await flush();
    expect(state.done, 'fulfilled after 1000 ms').toBe(true);
  } finally {
    clock.restore();
  }
});

test('the promise is fulfilled with the given value', async () => {
  const clock = useFakeClock();
  try {
    const record = { id: 'w-06', price: 18 };
    const state = watch(scope.delay(250, record));
    clock.advance(250);
    await flush();
    expect(state.value, 'the value that .then received').toBe(record);
  } finally {
    clock.restore();
  }
});

test('the page shows the bicycle one second after it loads', async () => {
  const status = screen.$('#status');
  expect(status, 'the #status paragraph').toBeInTheDocument();
  // Run index.js again on the fake clock, starting from a placeholder text.
  status.textContent = '…';
  const clock = useFakeClock();
  try {
    const run = await rerun();
    if (run.error) throw run.error;
    expect(status.textContent, 'the text right after the page loads').toBe('…');
    clock.advance(999);
    await flush();
    expect(status.textContent, 'the text after 999 ms').toBe('…');
    clock.advance(1);
    await flush();
    expect(status, 'the text after 1000 ms').toHaveTextContent(L.bicycle);
    expect(status, 'the text after 1000 ms').toHaveTextContent('240');
  } finally {
    clock.restore();
  }
});
