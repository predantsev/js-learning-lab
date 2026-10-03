import { evidence } from './evidence.js';
import { EXPENSES } from './expenses.js';

test('the note says what was recorded', () => {
  expect(typeof evidence.interaction, 'type of interaction').toBe('string');
  expect(evidence.interaction.trim().length, 'length of interaction').toBeGreaterThan(2);
});

test('records is the number of expenses on the page', () => {
  expect(evidence.records, 'records').toBe(EXPENSES.length);
});

test('slowest is the part with the longest render', () => {
  expect(evidence.slowest, 'slowest').toBe('ExpenseTable');
});

test('cause says why that part rendered', () => {
  expect(evidence.cause, 'cause').toBe('parent');
});

test('renderMs is a measured number of milliseconds', () => {
  expect(typeof evidence.renderMs, 'type of renderMs').toBe('number');
  expect(evidence.renderMs, 'renderMs').toBeGreaterThan(0);
  expect(evidence.renderMs, 'renderMs').toBeLessThan(10000);
});

test('phase names where the update spent most time', () => {
  expect(evidence.phase, 'phase').toBe('render');
});
