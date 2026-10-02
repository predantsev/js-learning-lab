const ready = () => expect(typeof scope.toHex, 'type of toHex').toBe('function');

test('the program prints dead0b07', () => {
  expect(logs(), 'the console of the program').toEqual(['dead0b07']);
});

test('every byte becomes exactly two characters', () => {
  ready();
  expect(scope.toHex(new Uint8Array([0, 15, 255])), 'toHex([0, 15, 255])').toBe('000fff');
  expect(scope.toHex(new Uint8Array([1, 2, 16])), 'toHex([1, 2, 16])').toBe('010210');
});

test('the letters are lowercase', () => {
  ready();
  expect(scope.toHex(new Uint8Array([171, 205, 239])), 'toHex([171, 205, 239])').toBe('abcdef');
});

test('no bytes give an empty string', () => {
  ready();
  expect(scope.toHex(new Uint8Array(0)), 'toHex of an empty Uint8Array').toBe('');
});

test('a long Uint8Array works too', () => {
  ready();
  const many = new Uint8Array(300).fill(160);
  expect(scope.toHex(many), 'toHex of 300 bytes of 160').toBe('a0'.repeat(300));
});

test('the bytes are not changed', () => {
  ready();
  const bytes = new Uint8Array([5, 250]);
  scope.toHex(bytes);
  expect(Array.from(bytes), 'the bytes after toHex').toEqual([5, 250]);
});
