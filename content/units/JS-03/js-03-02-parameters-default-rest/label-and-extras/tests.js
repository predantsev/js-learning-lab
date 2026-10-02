const label = (name, unit) => name + ' (' + unit + ')';

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('uses the default unit when it is missing', () => {
  expect(scope.makeLabel(L.bulbs), 'makeLabel(name)').toBe(label(L.bulbs, L.pcs));
  expect(scope.makeLabel(L.bulbs, undefined), 'makeLabel(name, undefined)').toBe(label(L.bulbs, L.pcs));
});

test('uses the unit it is given', () => {
  expect(scope.makeLabel(L.juice, L.liters), 'makeLabel(name, unit)').toBe(label(L.juice, L.liters));
});

test('counts only the arguments after the first', () => {
  expect(scope.countExtras(L.bulbs, L.juice, L.bread), 'countExtras with three arguments').toBe(2);
  expect(scope.countExtras(L.bulbs, L.juice), 'countExtras with two arguments').toBe(1);
});

test('gives 0 when there is nothing after the first argument', () => {
  expect(scope.countExtras(L.bulbs), 'countExtras with one argument').toBe(0);
  expect(scope.countExtras(), 'countExtras with no arguments').toBe(0);
});

test('prints the five results', () => {
  expect(logs()).toEqual([label(L.bulbs, L.pcs), label(L.juice, L.liters), '0', '0', '2']);
});
