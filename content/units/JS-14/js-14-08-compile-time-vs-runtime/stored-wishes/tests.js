import { parseStoredWishes } from './index.ts';

const wish = (fields) => ({ id: 'w-04', name: L.book, price: 25, acquired: true, category: null, ...fields });

test('valid stored text gives ok with every wish', () => {
  const text = JSON.stringify([wish({}), wish({ id: 'w-05', name: L.tickets, price: null, acquired: false })]);
  const result = parseStoredWishes(text);
  expect(result.ok, 'ok for two valid wishes').toBe(true);
  expect(result.value?.map((item) => item.id), 'ids in value').toEqual(['w-04', 'w-05']);
});

test('text that is not JSON gives the invalid-json error instead of throwing', () => {
  let result;
  expect(() => {
    result = parseStoredWishes('[{"id": "w-04"');
  }, 'calling parseStoredWishes with broken JSON').not.toThrow();
  expect(result, 'the result for broken JSON').toEqual({ ok: false, errors: ['invalid-json'] });
});

test('JSON that is not an array gives the not-an-array error', () => {
  expect(parseStoredWishes(JSON.stringify(wish({}))), 'one object instead of an array').toEqual({ ok: false, errors: ['not-an-array'] });
  expect(parseStoredWishes('42'), 'the number 42').toEqual({ ok: false, errors: ['not-an-array'] });
});

test('a record with a wrong field gives index.field errors', () => {
  const text = JSON.stringify([wish({}), wish({ id: 'w-06', price: '18', acquired: 'yes' })]);
  expect(parseStoredWishes(text), 'second record with a text price and a text acquired').toEqual({ ok: false, errors: ['1.price', '1.acquired'] });
});

test('a null record gives the index.record error', () => {
  expect(parseStoredWishes(JSON.stringify([null])), 'an array with null').toEqual({ ok: false, errors: ['0.record'] });
});

test('the program prints the good result and the price error', () => {
  expect(logs()[1], 'the second printed line').toBe('{"ok":false,"errors":["0.price"]}');
});
