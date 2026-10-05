const ready = () => expect(typeof scope.readOnly, 'type of readOnly').toBe('function');
const make = () => {
  ready();
  const settings = { currency: 'EUR', pageSize: 10, filters: ['food'] };
  return { settings, view: scope.readOnly(settings) };
};

test('the program prints the values, three TypeErrors and the unchanged settings', () => {
  expect(logs(), 'the console of the program').toEqual(['UAH 5', 'TypeError', 'TypeError', 'TypeError', '5 UAH']);
});

test('reading through the view gives the values', () => {
  const { view } = make();
  expect(view.currency, 'view.currency').toBe('EUR');
  expect(view.pageSize, 'view.pageSize').toBe(10);
  expect(view.missing, 'view.missing').toBeUndefined();
  expect('currency' in view, '"currency" in view').toBe(true);
});

test('assigning an existing key throws a TypeError and changes nothing', () => {
  const { settings, view } = make();
  expect(() => { view.pageSize = 99; }, 'view.pageSize = 99').toThrow(TypeError);
  expect(settings.pageSize, 'settings.pageSize after the attempt').toBe(10);
});

test('assigning a new key throws a TypeError and adds nothing', () => {
  const { settings, view } = make();
  expect(() => { view.theme = 'dark'; }, 'view.theme = "dark"').toThrow(TypeError);
  expect('theme' in settings, '"theme" in settings after the attempt').toBe(false);
});

test('deleting a key throws a TypeError and keeps it', () => {
  const { settings, view } = make();
  expect(() => { delete view.currency; }, 'delete view.currency').toThrow(TypeError);
  expect(settings.currency, 'settings.currency after the attempt').toBe('EUR');
});

test('the view is not a copy: changes to the original show through it', () => {
  const { settings, view } = make();
  expect(view === settings, 'view === settings').toBe(false);
  settings.pageSize = 25;
  expect(view.pageSize, 'view.pageSize after settings.pageSize = 25').toBe(25);
});
