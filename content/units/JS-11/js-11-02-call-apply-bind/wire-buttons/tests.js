const freshButtons = () => [document.createElement('button'), document.createElement('button')];

test('the program ends with two completions', () => {
  expect(logs(), 'the console after the clicks at the bottom of the file').toEqual(['2']);
});

test('wiring the buttons runs nothing yet', () => {
  expect(typeof scope.wire, 'type of wire').toBe('function');
  scope.habit.completed = 0;
  const [first, second] = freshButtons();
  scope.wire(first, second);
  expect(scope.habit.completed, 'habit.completed right after wire(first, second)').toBe(0);
});

test('each click counts once on the habit', () => {
  expect(typeof scope.wire, 'type of wire').toBe('function');
  scope.habit.completed = 0;
  const [first, second] = freshButtons();
  scope.wire(first, second);
  first.click();
  expect(scope.habit.completed, 'habit.completed after one click on the first button').toBe(1);
  second.click();
  expect(scope.habit.completed, 'habit.completed after one click on each button').toBe(2);
});

test('a click does not write onto the button', () => {
  expect(typeof scope.wire, 'type of wire').toBe('function');
  const [first, second] = freshButtons();
  scope.wire(first, second);
  first.click();
  second.click();
  expect(first.completed, 'the field completed of the first button').toBeUndefined();
  expect(second.completed, 'the field completed of the second button').toBeUndefined();
});
