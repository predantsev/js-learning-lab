// Records, in order, what the learner's code prints and what the check itself schedules.
// `setup` runs synchronously; then the check waits until every queue is empty.
async function recordOrder(setup) {
  const seen = [];
  const original = console.log;
  console.log = (...args) => {
    seen.push(String(args[0]));
    original(...args);
  };
  try {
    setup(seen);
    await sleep(60);
  } finally {
    console.log = original;
  }
  return seen;
}

function requireFunction(name) {
  expect(typeof scope[name], `type of ${name}`).toBe('function');
}

test('the file prints sync, micro, task in that order', () => {
  expect(logs().slice(0, 3), 'the first three printed lines').toEqual(['sync', 'micro', 'task']);
});

test('logSoon prints nothing right away', async () => {
  requireFunction('logSoon');
  const seen = await recordOrder((list) => {
    scope.logSoon('soon');
    expect([...list], 'printed during the call itself').toEqual([]);
  });
  expect(seen, 'printed in the end').toEqual(['soon']);
});

test('logSoon prints before a timer that was set earlier', async () => {
  requireFunction('logSoon');
  const seen = await recordOrder((list) => {
    setTimeout(() => list.push('[timer]'), 0);
    scope.logSoon('soon');
  });
  expect(seen, 'order of logSoon and a 0 ms timer set before it').toEqual(['soon', '[timer]']);
});

test('logLater prints nothing right away', async () => {
  requireFunction('logLater');
  const seen = await recordOrder((list) => {
    scope.logLater('later');
    expect([...list], 'printed during the call itself').toEqual([]);
  });
  expect(seen, 'printed in the end').toEqual(['later']);
});

test('logLater prints after a microtask that was queued later', async () => {
  requireFunction('logLater');
  const seen = await recordOrder((list) => {
    scope.logLater('later');
    queueMicrotask(() => list.push('[microtask]'));
  });
  expect(seen, 'order of logLater and a microtask queued after it').toEqual(['[microtask]', 'later']);
});
