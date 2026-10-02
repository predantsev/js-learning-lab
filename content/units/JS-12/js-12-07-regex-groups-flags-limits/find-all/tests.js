test('finds every position, ignoring letter case', () => {
  expect(scope.findAll('Лампа і лампа', 'ЛАМПА'), 'findAll("Лампа і лампа", "ЛАМПА")').toEqual([0, 8]);
  expect(scope.findAll('Lamp, lamp, LAMP', 'lamp'), 'findAll("Lamp, lamp, LAMP", "lamp")').toEqual([0, 6, 12]);
});

test('treats the query as plain text', () => {
  expect(scope.findAll('C++ and c++', 'c++'), 'findAll("C++ and c++", "c++")').toEqual([0, 8]);
  expect(scope.findAll('1.5 or 125', '1.5'), 'findAll("1.5 or 125", "1.5")').toEqual([0]);
  expect(scope.findAll('a (b) (c)', '('), 'findAll("a (b) (c)", "(")').toEqual([2, 6]);
});

test('searches only the first 200 characters', () => {
  expect(scope.findAll('x'.repeat(197) + 'c++', 'c++'), 'a match that ends at character 200').toEqual([197]);
  expect(scope.findAll('x'.repeat(198) + 'c++', 'c++'), 'a match that goes past character 200').toEqual([]);
  expect(scope.findAll('x'.repeat(5000) + 'c++', 'c++'), 'a match far past character 200').toEqual([]);
});

test('an empty query finds nothing', () => {
  expect(scope.findAll('abc', ''), 'findAll("abc", "")').toEqual([]);
});

test('no match gives an empty array', () => {
  expect(scope.findAll('abc', 'z'), 'findAll("abc", "z")').toEqual([]);
});
