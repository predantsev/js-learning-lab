// loadLabel(id) must return a promise; this helper fails with a clear message when it does not.
function call(id) {
  expect(typeof scope.loadLabel, 'type of loadLabel').toBe('function');
  const result = scope.loadLabel(id);
  expect(result instanceof Promise, `loadLabel("${id}") returns a promise`).toBe(true);
  return result;
}

test('gives the label of a known task', async () => {
  expect(await call('t-01'), 'loadLabel("t-01")').toBe(`${L.water} — 2026-03-02`);
  expect(await call('t-03'), 'loadLabel("t-03")').toBe(`${L.grandma} — ${L.noDate}`);
});

test('gives the not-found text for an unknown id', async () => {
  let label;
  try {
    label = await call('t-99');
  } catch (error) {
    throw new Error(`loadLabel("t-99") was rejected (${error?.message ?? error}) instead of being fulfilled with the not-found text`);
  }
  expect(label, 'loadLabel("t-99")').toBe(L.notFound);
});

test('loading is true while the task loads', async () => {
  const pending = call('t-01');
  expect(scope.loading, 'loading right after the call').toBe(true);
  await pending;
});

test('loading is false again after a known task', async () => {
  await call('t-03');
  expect(scope.loading, 'loading after loadLabel("t-03") finished').toBe(false);
});

test('loading is false again after an unknown id', async () => {
  await call('t-42').catch(() => {});
  expect(scope.loading, 'loading after loadLabel("t-42") finished').toBe(false);
});
