import { assertCrossable } from './crossable';
import { Budget } from './budget';

// Returns the TypeError assertCrossable threw, or null when it did not throw.
function rejection(props) {
  expect(typeof assertCrossable, 'type of assertCrossable').toBe('function');
  try {
    assertCrossable(props);
    return null;
  } catch (error) {
    return error;
  }
}

test('accepts plain data: text, numbers, booleans, null, undefined, arrays and plain objects', () => {
  expect(typeof assertCrossable, 'type of assertCrossable').toBe('function');
  const props = { id: 'e-01', amountMinor: 84550, paid: true, note: null, receipt: undefined, big: 10n, tags: ['food', 'weekly'], owner: { name: 'Ann', ids: [1, 2] } };
  expect(assertCrossable(props), 'assertCrossable(plain data)').toBe(true);
});

test('accepts Date, Map and Set, also inside other data', () => {
  expect(typeof assertCrossable, 'type of assertCrossable').toBe('function');
  const props = {
    date: new Date('2026-03-01T00:00:00Z'),
    categories: new Map([['food', 'Food']]),
    tags: new Set(['weekly']),
    history: [{ on: new Date('2026-02-28T00:00:00Z'), seen: new Set([1]) }],
  };
  expect(assertCrossable(props), 'assertCrossable(Date, Map, Set)').toBe(true);
});

test('rejects a function prop with a TypeError that names it', () => {
  const error = rejection({ id: 'e-03', onDelete: () => {} });
  expect(error, 'what assertCrossable({ id, onDelete: () => {} }) threw').toBeInstanceOf(TypeError);
  expect(error.message, 'the error message').toContain('onDelete');
});

test('rejects a class instance with a TypeError that names it', () => {
  const error = rejection({ id: 'e-03', budget: new Budget(500000) });
  expect(error, 'what assertCrossable({ id, budget: new Budget(…) }) threw').toBeInstanceOf(TypeError);
  expect(error.message, 'the error message').toContain('budget');
});

test('finds a function or a class instance inside arrays, objects, Map and Set', () => {
  const cases = [
    { actions: [() => {}] },
    { config: { format: (n) => n } },
    { byId: new Map([['e-01', new Budget(1)]]) },
    { handlers: new Set([() => {}]) },
  ];
  for (const props of cases) {
    const name = Object.keys(props)[0];
    const error = rejection(props);
    expect(error, `what assertCrossable threw for the prop "${name}"`).toBeInstanceOf(TypeError);
    expect(error.message, `the error message for "${name}"`).toContain(name);
  }
});
