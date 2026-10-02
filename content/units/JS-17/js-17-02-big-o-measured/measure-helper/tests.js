import * as helper from './measure.js';

const fn = (name) => {
  expect(typeof helper[name], `type of the ${name} export of measure.js`).toBe('function');
  return helper[name];
};

// A fake clock: performance.now() returns `clock.t`, and the timed function moves it forward.
function withFakeClock(run) {
  const clock = { t: 1000 };
  performance.now = () => clock.t;
  try {
    return run(clock);
  } finally {
    delete performance.now;
  }
}

test('median of an odd count is the middle value', () => {
  expect(fn('median')([3, 1, 2]), 'median([3, 1, 2])').toBe(2);
  expect(fn('median')([9, 10, 2]), 'median([9, 10, 2])').toBe(9);
});

test('median of an even count is the mean of the two middle values', () => {
  expect(fn('median')([4, 1, 3, 2]), 'median([4, 1, 3, 2])').toBe(2.5);
});

test('median leaves its list unchanged', () => {
  const times = [5, 1, 4];
  fn('median')(times);
  expect(times, 'the list after median(list)').toEqual([5, 1, 4]);
});

test('measure calls fn repeats times for every size', () => {
  const calls = [];
  fn('measure')((size) => {
    calls.push(size);
    return 0;
  }, [10, 20], 3);
  expect(calls, 'the sizes fn was called with').toEqual([10, 10, 10, 20, 20, 20]);
});

test('measure returns one row per size with the operations fn reported', () => {
  const rows = fn('measure')((size) => size * 2, [10, 20], 3);
  expect(Array.isArray(rows), 'measure(...) returns an array').toBe(true);
  expect(rows.map((row) => row.size), 'the size of every row').toEqual([10, 20]);
  expect(rows.map((row) => row.operations), 'the operations of every row').toEqual([20, 40]);
});

test('medianMs is the median of the timed runs', () => {
  const rows = withFakeClock((clock) => {
    const durations = { 10: [5, 1, 3], 20: [8, 30, 7] };
    return fn('measure')((size) => {
      clock.t += durations[size].shift();
      return 1;
    }, [10, 20], 3);
  });
  expect(rows.map((row) => row.medianMs), 'medianMs when the runs took 5, 1, 3 ms and 8, 30, 7 ms').toEqual([3, 8]);
});
