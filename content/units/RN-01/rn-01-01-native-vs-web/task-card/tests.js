import { formatLabel } from './domain/format.js';

const labels = { noDueDate: L.noDueDate, toggle: L.toggle };
const task = { id: 't-01', title: L.taskTitle, dueDate: '2026-03-02', done: false, priority: 'normal' };

// A phone delivers a tap to a component's onPress and never to onClick, while the browser preview
// fires onClick too. Find the nearest component above the button that received an onPress prop,
// as React recorded it for the latest render, so a check can deliver the tap the way a phone does.
function onPressAbove(element) {
  const fiberKey = Object.keys(element).find((name) => name.startsWith('__reactFiber$'));
  const propsKey = Object.keys(element).find((name) => name.startsWith('__reactProps$'));
  let fiber = fiberKey ? element[fiberKey] : null;
  // The node keeps the fiber it was created with; after an update the current one may be its alternate.
  if (fiber?.alternate && fiber.memoizedProps !== element[propsKey]) fiber = fiber.alternate;
  for (; fiber; fiber = fiber.return) {
    if (typeof fiber.memoizedProps?.onPress === 'function') return fiber.memoizedProps.onPress;
  }
  return undefined;
}

const isDone = () => screen.byRole('heading').textContent.startsWith('✓');

test('every element of the card is drawn by a React Native component', async () => {
  await waitFor(() => screen.byRole('heading'));
  const elements = screen.$$('#root *');
  expect(elements.length, 'number of elements in the card').toBeGreaterThan(0);
  // react-native-web gives every View a css-view-… class and every Text a css-text… class.
  const webOnly = elements.filter((element) => !/\bcss-(view|text)/.test(element.className)).map((element) => `<${element.tagName.toLowerCase()}>`);
  expect(webOnly, 'elements not produced by View, Text or Pressable').toEqual([]);
});

test('the heading shows the task through formatLabel', async () => {
  const heading = await waitFor(() => screen.byRole('heading'));
  expect(heading, 'the heading').toHaveTextContent(formatLabel(task, labels));
});

test('pressing the button toggles the task as done', async () => {
  const button = await waitFor(() => screen.byRole('button', { name: L.toggle }));
  const wasDone = isDone();
  await user.click(button);
  await waitFor(() => isDone() !== wasDone);
  expect(screen.byRole('heading'), 'the heading after one press').toHaveTextContent(formatLabel({ ...task, done: !wasDone }, labels));
});

test('a tap on a phone reaches the button through onPress', async () => {
  const button = await waitFor(() => screen.byRole('button', { name: L.toggle }));
  expect(button, 'a button named like the toggle label').toBeTruthy();
  const onPress = onPressAbove(button);
  expect(typeof onPress, 'type of the onPress above the button').toBe('function');
  const wasDone = isDone();
  onPress({ nativeEvent: {} });
  await waitFor(() => isDone() !== wasDone);
  expect(screen.byRole('heading'), 'the heading after one tap').toHaveTextContent(formatLabel({ ...task, done: !wasDone }, labels));
});
