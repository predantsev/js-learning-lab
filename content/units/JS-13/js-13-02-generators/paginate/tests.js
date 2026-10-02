const ready = () => expect(typeof scope.paginate, 'type of paginate').toBe('function');
const numbers = (count) => Array.from({ length: count }, (_, i) => i + 1);

test('the program prints 3,3,1', () => {
  expect(logs(), 'the console of the program').toEqual(['3,3,1']);
});

test('7 records in pages of 3 give 3 + 3 + 1', () => {
  ready();
  expect([...scope.paginate(numbers(7), 3)], 'pages of [1…7] with size 3').toEqual([[1, 2, 3], [4, 5, 6], [7]]);
});

test('0 records give no pages at all', () => {
  ready();
  expect([...scope.paginate([], 3)], 'pages of [] with size 3').toEqual([]);
});

test('1 record gives one page with it', () => {
  ready();
  expect([...scope.paginate(['only'], 3)], 'pages of ["only"] with size 3').toEqual([['only']]);
});

test('an exact multiple ends without an empty page', () => {
  ready();
  expect([...scope.paginate(numbers(6), 3)], 'pages of [1…6] with size 3').toEqual([[1, 2, 3], [4, 5, 6]]);
});

test('paginate is a generator function', () => {
  ready();
  const result = scope.paginate(numbers(2), 1);
  expect(typeof result.next, 'type of paginate(…).next').toBe('function');
  expect(result[Symbol.iterator](), 'paginate(…)[Symbol.iterator]()').toBe(result);
});

test('a page is built only when it is asked for', () => {
  ready();
  const records = numbers(7);
  const pages = scope.paginate(records, 3);
  expect(pages.next().value, 'the first page').toEqual([1, 2, 3]);
  records.push(8);
  expect([...pages], 'the pages after record 8 was added').toEqual([[4, 5, 6], [7, 8]]);
});
