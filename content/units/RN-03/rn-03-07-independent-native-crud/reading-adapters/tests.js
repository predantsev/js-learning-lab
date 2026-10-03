import { createFixedClock, createMemoryStorage, createProgressFormat, createReadingRepository } from './adapters.ts';

const KEY = 'jsll.reading.v1';
const percent = (locale, value) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value);
const repo = (storage = createMemoryStorage(), date = '2026-03-01') => createReadingRepository({ storage, clock: createFixedClock(date) });

test('the memory storage follows the storage contract', async () => {
  expect(typeof createMemoryStorage, 'type of createMemoryStorage').toBe('function');
  const store = createMemoryStorage();
  expect(typeof store.getItem(KEY)?.then, 'getItem(…).then').toBe('function');
  expect(await store.getItem(KEY), 'getItem of a new key').toBeNull();
  expect(await store.getItem('toString'), 'getItem("toString")').toBeNull();
  await store.setItem(KEY, 'x');
  expect(await store.getItem(KEY), 'getItem after setItem').toBe('x');
  await store.removeItem(KEY);
  expect(await store.getItem(KEY), 'getItem after removeItem').toBeNull();
});

test('two memory storages do not share values', async () => {
  const first = createMemoryStorage();
  const second = createMemoryStorage();
  await first.setItem('shared-check', 'only in the first');
  expect(await second.getItem('shared-check'), 'the second storage').toBeNull();
});

test('the memory storage leaves localStorage untouched', async () => {
  storage.clear();
  await createMemoryStorage().setItem(KEY, 'x');
  expect(storage.length, 'number of keys in localStorage').toBe(0);
});

test('progress is a whole percent for the given locale', () => {
  expect(typeof createProgressFormat, 'type of createProgressFormat').toBe('function');
  expect(createProgressFormat('en-US').progress(30, 120), 'en-US, 30 of 120').toBe(percent('en-US', 0.25));
  expect(createProgressFormat('de-DE').progress(37, 120), 'de-DE, 37 of 120').toBe(percent('de-DE', 37 / 120));
});

test('the fixed clock returns its date', () => {
  expect(typeof createFixedClock, 'type of createFixedClock').toBe('function');
  expect(createFixedClock('2026-03-01').today(), 'today()').toBe('2026-03-01');
});

test('add stores the book validated by the domain module', async () => {
  expect(typeof createReadingRepository, 'type of createReadingRepository').toBe('function');
  const repository = repo();
  expect(await repository.add({ id: 'b-01', title: `  ${L.poems}  `, pagesTotal: 120 }), 'result of add').toEqual({ ok: true });
  expect(await repository.load(), 'load() after add').toEqual([{ id: 'b-01', title: L.poems, pagesTotal: 120, pagesRead: 0, finishedOn: null }]);
});

test('an invalid book is refused with the domain errors and not stored', async () => {
  expect(typeof createReadingRepository, 'type of createReadingRepository').toBe('function');
  const repository = repo();
  const result = await repository.add({ id: 'b-02', title: '   ', pagesTotal: 0 });
  expect(result, 'result of add').toEqual({ ok: false, errors: { title: 'titleLength', pagesTotal: 'pagesPositive' } });
  expect(await repository.load(), 'load() after a refused add').toEqual([]);
});

test('finish uses the date from the clock adapter', async () => {
  expect(typeof createReadingRepository, 'type of createReadingRepository').toBe('function');
  const repository = repo(createMemoryStorage(), '2026-03-01');
  await repository.add({ id: 'b-03', title: L.guide, pagesTotal: 200 });
  await repository.add({ id: 'b-04', title: L.novel, pagesTotal: 90 });
  await repository.finish('b-03');
  expect(await repository.load(), 'load() after finish').toEqual([
    { id: 'b-03', title: L.guide, pagesTotal: 200, pagesRead: 200, finishedOn: '2026-03-01' },
    { id: 'b-04', title: L.novel, pagesTotal: 90, pagesRead: 0, finishedOn: null },
  ]);
});

test('the books live in the given storage as a versioned envelope', async () => {
  expect(typeof createReadingRepository, 'type of createReadingRepository').toBe('function');
  const shared = createMemoryStorage();
  await repo(shared).add({ id: 'b-05', title: L.novel, pagesTotal: 90 });
  const text = await shared.getItem(KEY);
  expect(text === null ? null : JSON.parse(text), `JSON under ${KEY}`).toEqual({
    schemaVersion: 1,
    records: [{ id: 'b-05', title: L.novel, pagesTotal: 90, pagesRead: 0, finishedOn: null }],
  });
  expect(await repo(shared).load(), 'load() of a second repository on the same storage').toHaveLength(1);
});
