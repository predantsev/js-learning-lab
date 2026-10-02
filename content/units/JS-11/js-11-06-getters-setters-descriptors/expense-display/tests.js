const ready = () => expect(typeof scope.Expense, 'type of Expense').toBe('function');

test('the program prints both displays and the own fields', () => {
  expect(logs(), 'the console of the program').toEqual([L.lunch + ': 210.50', L.lunch + ': 250.00', 'label,amountMinor']);
});

test('display shows the current amount', () => {
  ready();
  const expense = new scope.Expense(L.lunch, 5);
  expect(expense.display, 'display of an expense of 5 minor units').toBe(L.lunch + ': 0.05');
  expense.amountMinor = 12345;
  expect(expense.display, 'display after amountMinor changed to 12345').toBe(L.lunch + ': 123.45');
});

test('display is a getter without a setter on the prototype', () => {
  ready();
  const descriptor = Object.getOwnPropertyDescriptor(scope.Expense.prototype, 'display');
  expect(descriptor, 'the descriptor of display on Expense.prototype').toBeDefined();
  expect(typeof descriptor.get, 'type of the getter in the descriptor').toBe('function');
  expect(descriptor.set, 'the setter in the descriptor').toBeUndefined();
});

test('display is not stored in the instance', () => {
  ready();
  const expense = new scope.Expense(L.lunch, 100);
  expect(Object.hasOwn(expense, 'display'), 'display as an own property').toBe(false);
  expect(Object.keys(expense), 'the own names of an expense').toEqual(['label', 'amountMinor']);
});

test('assigning to display is refused', () => {
  ready();
  const expense = new scope.Expense(L.lunch, 100);
  expect(() => {
    expense.display = 'x';
  }, 'assigning to display').toThrow(TypeError);
  expect(expense.label, 'the label after the refused assignment').toBe(L.lunch);
});
