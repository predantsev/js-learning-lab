import { createMemoryStorage, createPriceFormat } from './adapters.ts';

const KEY = 'jsll.wishlist.v1';
const whole = (locale, value) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value);

test('every storage method returns a promise', () => {
  expect(typeof createMemoryStorage, 'type of createMemoryStorage').toBe('function');
  const store = createMemoryStorage();
  expect(typeof store.getItem(KEY)?.then, 'getItem(…).then').toBe('function');
  expect(typeof store.setItem(KEY, '[]')?.then, 'setItem(…).then').toBe('function');
  expect(typeof store.removeItem(KEY)?.then, 'removeItem(…).then').toBe('function');
});

test('getItem of a key that was never set gives null', async () => {
  const store = createMemoryStorage();
  expect(await store.getItem(KEY), 'getItem of a new key').toBeNull();
  expect(await store.getItem('toString'), 'getItem("toString")').toBeNull();
});

test('setItem then getItem gives back the same text', async () => {
  const store = createMemoryStorage();
  await store.setItem(KEY, '{"schemaVersion":1,"records":[]}');
  expect(await store.getItem(KEY), 'getItem after setItem').toBe('{"schemaVersion":1,"records":[]}');
  await store.setItem(KEY, '{"schemaVersion":1,"records":[1]}');
  expect(await store.getItem(KEY), 'getItem after a second setItem').toBe('{"schemaVersion":1,"records":[1]}');
});

test('removeItem deletes the value', async () => {
  const store = createMemoryStorage();
  await store.setItem(KEY, 'x');
  await store.removeItem(KEY);
  expect(await store.getItem(KEY), 'getItem after removeItem').toBeNull();
});

test('two storages do not share values', async () => {
  const first = createMemoryStorage();
  const second = createMemoryStorage();
  await first.setItem('shared-check', 'only in the first');
  expect(await second.getItem('shared-check'), 'the second storage').toBeNull();
});

test('the memory storage leaves localStorage untouched', async () => {
  storage.clear();
  const store = createMemoryStorage();
  await store.setItem(KEY, 'x');
  expect(storage.length, 'number of keys in localStorage').toBe(0);
});

test('price formats whole hryvnias for the given locale', () => {
  expect(typeof createPriceFormat, 'type of createPriceFormat').toBe('function');
  expect(createPriceFormat('uk-UA', '—').price(80), 'uk-UA, 80').toBe(whole('uk-UA', 80));
  expect(createPriceFormat('en-US', '—').price(1240), 'en-US, 1240').toBe(whole('en-US', 1240));
});

test('null is the no-price label and 0 is a price', () => {
  expect(typeof createPriceFormat, 'type of createPriceFormat').toBe('function');
  const format = createPriceFormat('uk-UA', L.noPrice);
  expect(format.price(null), 'price(null)').toBe(L.noPrice);
  expect(format.price(0), 'price(0)').toBe(whole('uk-UA', 0));
});
