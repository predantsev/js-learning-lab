const ready = () => expect(typeof scope.BoundedCounter, 'type of BoundedCounter').toBe('function');

test('the program prints 3, 2 and RangeError', () => {
  expect(logs(), 'the console of the program').toEqual(['3', '2', 'RangeError']);
});

test('the counter starts at 0 and stops at the maximum', () => {
  ready();
  const counter = new scope.BoundedCounter(2);
  expect(counter.value(), 'value() of a new counter').toBe(0);
  counter.increment();
  counter.increment();
  counter.increment();
  expect(counter.value(), 'value() after three increments with the maximum 2').toBe(2);
});

test('decrement stops at 0', () => {
  ready();
  const counter = new scope.BoundedCounter(3);
  counter.increment();
  counter.decrement();
  counter.decrement();
  expect(counter.value(), 'value() after one increment and two decrements').toBe(0);
});

test('fromJSON restores a valid counter', () => {
  ready();
  const counter = scope.BoundedCounter.fromJSON({ count: 4, max: 5 });
  expect(counter, 'the result of fromJSON').toBeInstanceOf(scope.BoundedCounter);
  expect(counter.value(), 'value() of the restored counter').toBe(4);
  counter.increment();
  counter.increment();
  expect(counter.value(), 'value() after two more increments with the maximum 5').toBe(5);
});

test('fromJSON rejects invalid data with a RangeError', () => {
  ready();
  const bad = [
    [{ count: 9, max: 5 }, 'a count above the maximum'],
    [{ count: -1, max: 5 }, 'a negative count'],
    [{ count: 1, max: 0 }, 'a maximum of 0'],
    [{ count: 1.5, max: 5 }, 'a fractional count'],
    [{ count: '2', max: 5 }, 'a count that is text'],
    [{ max: 5 }, 'a missing count'],
  ];
  for (const [data, what] of bad) {
    expect(() => scope.BoundedCounter.fromJSON(data), what).toThrow(RangeError);
  }
});

test('the count and the maximum are private', () => {
  ready();
  const counter = scope.BoundedCounter.fromJSON({ count: 1, max: 5 });
  expect(Object.getOwnPropertyNames(counter), 'the own property names of a counter').toEqual([]);
  expect(counter.count, 'counter.count').toBeUndefined();
  expect(counter._count, 'counter._count').toBeUndefined();
});

test('fromJSON belongs to the class, not to its instances', () => {
  ready();
  const counter = new scope.BoundedCounter(2);
  expect(counter.fromJSON, 'counter.fromJSON').toBeUndefined();
  expect(typeof scope.BoundedCounter.fromJSON, 'type of BoundedCounter.fromJSON').toBe('function');
});

test('two counters keep their own counts', () => {
  ready();
  const first = new scope.BoundedCounter(5);
  const second = new scope.BoundedCounter(5);
  first.increment();
  expect(first.value(), 'value() of the counter that was incremented').toBe(1);
  expect(second.value(), 'value() of the other counter').toBe(0);
});
