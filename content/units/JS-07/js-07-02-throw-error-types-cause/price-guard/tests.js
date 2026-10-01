// The checks see the function only when the file ran to its end: an uncaught error
// (for example, an uncommented trial call) stops the file before it is shared.
const guard = () => {
  const fn = scope.assertValidPrice;
  expect(typeof fn, 'assertValidPrice as the checks see it (the file must run to its end)').toBe('function');
  return fn;
};

const thrownBy = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
};

test('the file runs to its end', () => {
  expect(loadError(), 'uncaught error while the file ran').toBeNull();
});

test('returns a valid price unchanged', () => {
  const assertValidPrice = guard();
  expect(assertValidPrice(45), 'assertValidPrice(45)').toBe(45);
  expect(assertValidPrice(0), 'assertValidPrice(0)').toBe(0);
  expect(assertValidPrice(240), 'assertValidPrice(240)').toBe(240);
});

test('accepts null as no price', () => {
  const assertValidPrice = guard();
  expect(assertValidPrice(null), 'assertValidPrice(null)').toBeNull();
});

test('throws a TypeError for a price written as text', () => {
  const assertValidPrice = guard();
  expect(() => assertValidPrice('80'), 'assertValidPrice("80")').toThrow(TypeError);
});

test('throws a TypeError for a missing price', () => {
  const assertValidPrice = guard();
  expect(() => assertValidPrice(undefined), 'assertValidPrice(undefined)').toThrow(TypeError);
});

test('throws a TypeError for NaN', () => {
  const assertValidPrice = guard();
  expect(() => assertValidPrice(NaN), 'assertValidPrice(NaN)').toThrow(TypeError);
});

test('throws a RangeError for a negative price', () => {
  const assertValidPrice = guard();
  expect(() => assertValidPrice(-5), 'assertValidPrice(-5)').toThrow(RangeError);
  expect(() => assertValidPrice(-0.5), 'assertValidPrice(-0.5)').toThrow(RangeError);
});

test('the message names the bad value', () => {
  const assertValidPrice = guard();
  for (const [value, shown] of [['80', '80'], [-5, '-5'], [NaN, 'NaN']]) {
    const error = thrownBy(() => assertValidPrice(value));
    expect(error?.message, 'the message of the error for ' + shown).toContain(shown);
  }
});
