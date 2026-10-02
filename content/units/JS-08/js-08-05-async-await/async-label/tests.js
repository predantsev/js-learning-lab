// Calls loadLabel and fails with a clear message when it throws or does not return a promise.
function call(id) {
  expect(typeof scope.loadLabel, 'type of loadLabel').toBe('function');
  let result;
  try {
    result = scope.loadLabel(id);
  } catch (error) {
    throw new Error(`loadLabel(${JSON.stringify(id)}) threw ${error?.name ?? 'an error'} at once instead of returning a promise`);
  }
  expect(result instanceof Promise, `loadLabel(${JSON.stringify(id)}) returns a promise`).toBe(true);
  return result;
}

async function settled(id) {
  try {
    return { value: await call(id) };
  } catch (error) {
    return { error };
  }
}

test('gives the label of a known task', async () => {
  expect(await call('t-01'), 'loadLabel("t-01")').toBe(`${L.water} — 2026-03-02`);
  expect(await call('t-03'), 'loadLabel("t-03")').toBe(`${L.grandma} — ${L.noDate}`);
});

test('gives the not-found text for an unknown id', async () => {
  const result = await settled('t-99');
  expect(result.error?.message, 'the error of loadLabel("t-99")').toBeUndefined();
  expect(result.value, 'loadLabel("t-99")').toBe(L.notFound);
});

test('gives the not-found text for an id that is not text', async () => {
  const result = await settled(42);
  expect(result.error?.message, 'the error of loadLabel(42)').toBeUndefined();
  expect(result.value, 'loadLabel(42)').toBe(L.notFound);
});

test('loading is true while the task loads', async () => {
  const pending = call('t-01');
  expect(scope.loading, 'loading right after the call').toBe(true);
  await pending;
});

test('loading is false again after every outcome', async () => {
  await settled('t-03');
  expect(scope.loading, 'loading after a known task').toBe(false);
  await settled('t-42');
  expect(scope.loading, 'loading after an unknown id').toBe(false);
  await settled(7);
  expect(scope.loading, 'loading after an id that is not text').toBe(false);
});
