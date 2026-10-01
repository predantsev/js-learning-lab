// Arrow functions have no own `prototype` property; function declarations and expressions do.
const isArrow = (fn) => typeof fn === 'function' && !('prototype' in fn);

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('trimName removes spaces at the edges only', () => {
  expect(scope.trimName('  Lamp  '), 'trimName("  Lamp  ")').toBe('Lamp');
  expect(scope.trimName('Desk lamp'), 'trimName("Desk lamp")').toBe('Desk lamp');
});

test('trimName without a name gives an empty string', () => {
  expect(scope.trimName(), 'trimName()').toBe('');
  expect(scope.trimName(undefined), 'trimName(undefined)').toBe('');
});

test('describe counts the tags', () => {
  expect(scope.describe('Lamp', 'home', 'light'), 'describe("Lamp", "home", "light")').toBe('Lamp [2]');
  expect(scope.describe('Lamp', 'home'), 'describe("Lamp", "home")').toBe('Lamp [1]');
});

test('describe works without tags', () => {
  expect(scope.describe('Lamp'), 'describe("Lamp")').toBe('Lamp [0]');
});

test('describe trims the name', () => {
  expect(scope.describe('  Lamp ', 'home'), 'describe("  Lamp ", "home")').toBe('Lamp [1]');
});

test('withFallback returns the result of fn', () => {
  const doubled = scope.withFallback((n) => n * 2, '—');
  expect(doubled(4), 'withFallback(n => n * 2, "—")(4)').toBe(8);
});

test('withFallback replaces null and undefined', () => {
  expect(scope.withFallback(() => null, '—')(1), 'when fn returns null').toBe('—');
  expect(scope.withFallback(() => undefined, '—')(1), 'when fn returns undefined').toBe('—');
});

test('withFallback keeps 0 and an empty string', () => {
  expect(scope.withFallback(() => 0, '—')(1), 'when fn returns 0').toBe(0);
  expect(scope.withFallback(() => '', '—')(1), 'when fn returns ""').toBe('');
});

test('withFallback calls fn only when the new function is called', () => {
  const fn = spy((value) => value);
  const safe = scope.withFallback(fn, '—');
  expect(fn, 'fn right after withFallback(fn, "—")').toHaveBeenCalledTimes(0);
  expect(safe(7), 'the new function called with 7').toBe(7);
  expect(fn, 'fn after one call of the new function').toHaveBeenCalledTimes(1);
  expect(fn.calls[0][0], 'the argument fn received').toBe(7);
});

test('compose calls g first, then f', () => {
  const addOne = (n) => n + 1;
  const double = (n) => n * 2;
  expect(scope.compose(double, addOne)(3), 'compose(double, addOne)(3)').toBe(8);
  expect(scope.compose(addOne, double)(3), 'compose(addOne, double)(3)').toBe(7);
});

test('all four are arrow functions', () => {
  for (const name of ['trimName', 'describe', 'withFallback', 'compose']) {
    expect(isArrow(scope[name]), `${name} is an arrow function`).toBe(true);
  }
});

test('nothing is printed and inputs stay unchanged', () => {
  const before = logs().length;
  const record = { name: ' Lamp ', price: 0 };
  scope.trimName(record.name);
  scope.describe(record.name, 'a', 'b');
  scope.withFallback((r) => r.price, '—')(record);
  scope.compose((text) => text + '!', (r) => r.name)(record);
  expect(logs().length - before, 'lines printed by the four functions').toBe(0);
  expect(record, 'the record after all calls').toEqual({ name: ' Lamp ', price: 0 });
});
