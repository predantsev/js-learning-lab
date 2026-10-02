const ready = () => {
  expect(typeof scope.byteLength, 'type of byteLength').toBe('function');
  expect(typeof scope.truncateToBytes, 'type of truncateToBytes').toBe('function');
};
const whole = (text) => new TextDecoder().decode(new TextEncoder().encode(text)) === text;
const utf8 = (text) => new TextEncoder().encode(text).length;

test('the program prints 13 and Киї', () => {
  expect(logs(), 'the console of the program').toEqual(['13', 'Киї']);
});

test('byteLength counts UTF-8 bytes, not string length', () => {
  ready();
  expect(scope.byteLength('abc'), 'byteLength("abc")').toBe(3);
  expect(scope.byteLength('Київ'), 'byteLength("Київ")').toBe(8);
  expect(scope.byteLength('🐈'), 'byteLength("🐈")').toBe(4);
  expect(scope.byteLength(''), 'byteLength("")').toBe(0);
});

test('Cyrillic text is cut only between letters', () => {
  ready();
  expect(scope.truncateToBytes('Київ', 5), 'truncateToBytes("Київ", 5)').toBe('Ки');
  expect(scope.truncateToBytes('Київ', 8), 'truncateToBytes("Київ", 8)').toBe('Київ');
  expect(scope.truncateToBytes('Київ', 1), 'truncateToBytes("Київ", 1)').toBe('');
});

test('an emoji is kept whole or left out', () => {
  ready();
  expect(scope.truncateToBytes('🐈🐈', 5), 'truncateToBytes("🐈🐈", 5)').toBe('🐈');
  expect(scope.truncateToBytes('a🐈', 3), 'truncateToBytes("a🐈", 3)').toBe('a');
});

test('ASCII text is cut at exactly maxBytes', () => {
  ready();
  expect(scope.truncateToBytes('abcdef', 4), 'truncateToBytes("abcdef", 4)').toBe('abcd');
  expect(scope.truncateToBytes('abc', 10), 'truncateToBytes("abc", 10)').toBe('abc');
});

test('the result always fits, starts the text and has no broken characters', () => {
  ready();
  const samples = ['Київ, Львів 🐈', 'Ранкова зарядка', '🐈a🐈bб', 'Ще 5 хв'];
  for (const text of samples) {
    for (let max = 0; max <= utf8(text) + 1; max += 1) {
      const result = scope.truncateToBytes(text, max);
      const where = `truncateToBytes(${JSON.stringify(text)}, ${max})`;
      expect(typeof result, `type of ${where}`).toBe('string');
      expect(utf8(result) <= max, `${where} fits into ${max} bytes`).toBe(true);
      expect(text.startsWith(result), `${where} is a beginning of the text`).toBe(true);
      expect(whole(result), `${where} has no broken character`).toBe(true);
      expect(result.includes('�'), `${where} contains a replacement character`).toBe(false);
    }
  }
});

test('the longest fitting beginning is returned', () => {
  ready();
  expect(scope.truncateToBytes('Київ 🐈', 9), 'truncateToBytes("Київ 🐈", 9)').toBe('Київ ');
  expect(scope.truncateToBytes('Київ 🐈', 13), 'truncateToBytes("Київ 🐈", 13)').toBe('Київ 🐈');
});
