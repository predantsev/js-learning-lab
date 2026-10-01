test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('shows the walk progress as 0/5', () => {
  expect(logs()[0], 'report line 1').toBe(`${L.walk}: 0/5`);
});

test('gives the walk a mark', () => {
  expect(logs()[1], 'report line 2').toBe(`${L.walk}: ${L.keepGoing}`);
});

test('counts the water points with a bonus of 0', () => {
  expect(logs()[2], 'report line 3').toBe(`${L.water}: 70`);
});

test('marks the water goal as reached', () => {
  expect(logs()[3], 'report line 4').toBe(`${L.water}: ${L.reached}`);
  expect(logs(), 'number of report lines').toHaveLength(4);
});
