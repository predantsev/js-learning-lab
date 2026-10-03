import * as domain from './domain/index';
import * as types from './domain/types';
import * as validate from './domain/validate';
import * as summarize from './domain/summarize';

const exported = () => Object.keys(domain).sort();

test('domain/index exports no storage functions', () => {
  expect(exported().filter((name) => name === 'loadHabits' || name === 'saveHabits'), 'storage functions among the exports').toEqual([]);
});

test('domain/index exports no React components', () => {
  expect(exported().filter((name) => name === 'HabitCard'), 'components among the exports').toEqual([]);
});

test('domain/index exports the validator, the transforms and FREQUENCIES', () => {
  expect(domain.validateHabit === validate.validateHabit, 'validateHabit is the function from validate.ts').toBe(true);
  expect(domain.summarizeHabit === summarize.summarizeHabit, 'summarizeHabit is the function from summarize.ts').toBe(true);
  expect(domain.addCompletion === summarize.addCompletion, 'addCompletion is the function from summarize.ts').toBe(true);
  expect(domain.FREQUENCIES === types.FREQUENCIES, 'FREQUENCIES is the array from types.ts').toBe(true);
});

test('domain/index exports exactly the four domain values', () => {
  expect(exported(), 'the names a module that imports domain/index sees at runtime').toEqual(['FREQUENCIES', 'addCompletion', 'summarizeHabit', 'validateHabit']);
});

test('the page still works through domain/index', async () => {
  await waitFor(() => screen.$('[data-part="check"]') !== null);
  expect(screen.$('[data-part="check"]'), 'the validator line').toHaveTextContent('frequency');
  expect(screen.$$('li').length, 'habit cards on the page').toBe(2);
});
