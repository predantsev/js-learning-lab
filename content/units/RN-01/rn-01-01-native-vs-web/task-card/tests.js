import { formatLabel } from './domain/format.js';

const labels = { noDueDate: L.noDueDate, toggle: L.toggle };
const task = { id: 't-01', title: L.taskTitle, dueDate: '2026-03-02', done: false, priority: 'normal' };

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
  await user.click(button);
  await waitFor(() => screen.byRole('heading').textContent.startsWith('✓'));
  expect(screen.byRole('heading'), 'the heading after one press').toHaveTextContent(formatLabel({ ...task, done: true }, labels));
});
