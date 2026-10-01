const H = (id, completions, extra = {}) => ({ id, name: id, frequency: 'daily', active: true, completions, ...extra });
const list = () => [H('h-01', ['2026-02-28', '2026-03-01']), H('h-02', ['2026-03-01']), H('h-06', [])];
// A record that inherits two fields from shared defaults, like the ones makeHabit creates.
const inheriting = () => {
  const record = Object.create({ frequency: 'daily', active: true });
  record.id = 'h-07';
  record.name = 'h-07';
  record.completions = [];
  return record;
};

test('findHabit finds a habit by id', () => {
  const habits = list();
  expect(scope.findHabit(habits, 'h-02') === habits[1], 'findHabit(habits, "h-02") returns that very habit').toBe(true);
});

test('findHabit returns null for an unknown id and an empty list', () => {
  expect(scope.findHabit(list(), 'h-99'), 'findHabit with an unknown id').toBeNull();
  expect(scope.findHabit([], 'h-01'), 'findHabit on an empty list').toBeNull();
});

test('firstDoneOn returns the first habit done that day', () => {
  expect(scope.firstDoneOn(list(), '2026-03-01')?.id, 'two habits were done on 2026-03-01').toBe('h-01');
  expect(scope.firstDoneOn([H('h-05', []), H('h-02', ['2026-03-01'])], '2026-03-01')?.id, 'the match is in the second habit').toBe('h-02');
  expect(scope.firstDoneOn(list(), '2026-01-01'), 'no habit was done that day').toBeNull();
});

test('lastDays gives null to a habit without completions', () => {
  expect(scope.lastDays(list()), 'lastDays for a list ending with an empty habit').toEqual(['2026-03-01', '2026-03-01', null]);
  expect(scope.lastDays([]), 'lastDays([])').toEqual([]);
});

test('fieldNames lists only the own fields', () => {
  expect(scope.fieldNames(inheriting()), 'fields of a record that inherits frequency and active').toEqual(['id', 'name', 'completions']);
  expect(scope.fieldNames({ id: 'h-01', active: true }), 'fields of a plain record').toEqual(['id', 'active']);
  expect(scope.fieldNames({}), 'fields of {}').toEqual([]);
});

test('updateHabit merges the changes into a new habit', () => {
  const result = scope.updateHabit(list(), 'h-02', { active: false });
  expect(result?.[1], 'the updated habit').toEqual(H('h-02', ['2026-03-01'], { active: false }));
});

test('updateHabit leaves the original list and habits unchanged', () => {
  const habits = list();
  const second = habits[1];
  const result = scope.updateHabit(habits, 'h-02', { active: false });
  expect(second.active, 'active of the original h-02').toBe(true);
  expect(habits[1] === second, 'the original list still holds the old habit').toBe(true);
  expect(result === habits, 'result === habits').toBe(false);
});

test('updateHabit reuses the untouched habits', () => {
  const habits = list();
  const result = scope.updateHabit(habits, 'h-02', { active: false });
  expect(result?.[0] === habits[0], 'result[0] === habits[0]').toBe(true);
  expect(result?.[2] === habits[2], 'result[2] === habits[2]').toBe(true);
});
