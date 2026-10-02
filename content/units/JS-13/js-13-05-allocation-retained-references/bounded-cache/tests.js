const ready = () => expect(typeof scope.createCache, 'type of createCache').toBe('function');

test('the program prints 2, undefined and the bicycle', () => {
  expect(logs(), 'the console of the program').toEqual([`2 undefined ${L.bicycle}`]);
});

test('size never exceeds the limit', () => {
  ready();
  const cache = scope.createCache(3);
  for (let i = 1; i <= 10; i += 1) {
    cache.set(`k${i}`, i);
    expect(cache.size <= 3, `size ${cache.size} after ${i} sets with limit 3 is at most 3`).toBe(true);
  }
  expect(cache.size, 'size after 10 sets with limit 3').toBe(3);
});

test('the oldest entry is removed first', () => {
  ready();
  const cache = scope.createCache(3);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  cache.set('d', 4);
  expect(cache.get('a'), 'get("a") after a, b, c, d with limit 3').toBeUndefined();
  expect([cache.get('b'), cache.get('c'), cache.get('d')], 'get of b, c, d').toEqual([2, 3, 4]);
});

test('setting an existing key makes it the newest', () => {
  ready();
  const cache = scope.createCache(3);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  cache.set('a', 10);
  expect(cache.size, 'size after setting a again').toBe(3);
  cache.set('d', 4);
  expect(cache.get('a'), 'get("a") after it was set again and d was added').toBe(10);
  expect(cache.get('b'), 'get("b") — now the oldest').toBeUndefined();
});

test('get returns the value, or undefined for a missing key', () => {
  ready();
  const cache = scope.createCache(2);
  cache.set('w-01', { name: 'lamp' });
  expect(cache.get('w-01'), 'get("w-01")').toEqual({ name: 'lamp' });
  expect(cache.get('w-99'), 'get("w-99")').toBeUndefined();
  expect(cache.size, 'size after one set').toBe(1);
});

test('a limit of 1 keeps only the newest entry', () => {
  ready();
  const cache = scope.createCache(1);
  cache.set('a', 1);
  cache.set('b', 2);
  expect(cache.size, 'size with limit 1').toBe(1);
  expect([cache.get('a'), cache.get('b')], 'get of a and b').toEqual([undefined, 2]);
});

test('two caches do not share entries', () => {
  ready();
  const first = scope.createCache(2);
  const second = scope.createCache(2);
  first.set('a', 1);
  expect(second.size, 'size of the second cache').toBe(0);
  expect(second.get('a'), 'second.get("a")').toBeUndefined();
});
