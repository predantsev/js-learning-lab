// rerun() evaluates index.js again, as a fresh module, with the given globals.
test('hot above 25', async () => {
  const run = await rerun({ globals: { temperature: 31 } });
  expect(run.error, 'error while running').toBeNull();
  expect(run.logs, 'printed lines for 31').toEqual([L.hot]);
});

test('cool at 25 and below', async () => {
  expect((await rerun({ globals: { temperature: 25 } })).logs, 'printed lines for 25').toEqual([L.cool]);
  expect((await rerun({ globals: { temperature: -4 } })).logs, 'printed lines for -4').toEqual([L.cool]);
});
