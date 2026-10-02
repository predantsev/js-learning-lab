const KEY = 'jsll.habits.v1';
const BACKUP = 'jsll.habits.v1.backup';
const habits = () => [
  { id: 'h-01', name: L.exercise, completions: ['2026-02-28', '2026-03-01'] },
  { id: 'h-04', name: L.tidy, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-06', name: L.walk, completions: [] },
];
const broken = () => [...habits(), { id: 'h-07', name: L.stretch }];

const thrownBy = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
};

// Runs `use(storage)` with only `text` stored under the key (nothing when text is null),
// then puts the exercise's own storage back exactly as it was.
function withStored(text, use) {
  const before = {};
  for (let i = 0; i < storage.length; i += 1) before[storage.key(i)] = storage.getItem(storage.key(i));
  storage.clear();
  if (text !== null) storage.setItem(KEY, text);
  try {
    return use();
  } finally {
    storage.clear();
    for (const [key, value] of Object.entries(before)) storage.setItem(key, value);
  }
}

const fn = (name) => {
  const value = scope[name];
  expect(typeof value, name + ' as the checks see it (the file must run to its end)').toBe('function');
  return value;
};

test('the file runs to its end', () => {
  expect(loadError(), 'uncaught error while the file ran').toBeNull();
});

test('countDoneOn counts the habits done on a day', () => {
  expect(fn('countDoneOn')(habits(), '2026-03-01'), 'countDoneOn(three habits, "2026-03-01")').toBe(2);
  expect(fn('countDoneOn')(habits(), '2026-02-25'), 'countDoneOn(three habits, "2026-02-25")').toBe(0);
});

test('countDoneOn throws for an unreadable habit, naming it', () => {
  const countDoneOn = fn('countDoneOn');
  const error = thrownBy(() => countDoneOn(broken(), '2026-03-01'));
  expect(error, 'what countDoneOn throws for a habit without completions').not.toBeNull();
  expect(String(error?.message), 'the message of that error').toContain('h-07');
});

test('the error from countDoneOn keeps the original error as its cause', () => {
  const countDoneOn = fn('countDoneOn');
  const error = thrownBy(() => countDoneOn(broken(), '2026-03-01'));
  expect(error?.cause instanceof TypeError, 'the cause is the original TypeError').toBe(true);
});

test('saveHabits saves valid habits and reports ok', () => {
  withStored(null, () => {
    expect(fn('saveHabits')(storage, habits()), 'saveHabits(storage, three habits)').toEqual({ ok: true, count: 3 });
    expect(JSON.parse(storage.getItem(KEY)), 'the stored value').toEqual({ schemaVersion: 1, records: habits() });
  });
});

test('saveHabits lets a failure reach the caller', () => {
  withStored(null, () => {
    const saveHabits = fn('saveHabits');
    const looped = { id: 'h-08', name: L.stretch, completions: [] };
    looped.self = looped;
    const error = thrownBy(() => saveHabits(storage, [looped]));
    expect(error, 'what saveHabits throws for a habit that contains itself').not.toBeNull();
  });
});

test('loadHabits reads valid stored habits', () => {
  withStored(JSON.stringify({ schemaVersion: 1, records: habits() }), () => {
    expect(fn('loadHabits')(storage), 'loadHabits(storage)').toEqual(habits());
  });
});

test('loadHabits gives an empty list when nothing is saved', () => {
  withStored(null, () => {
    expect(fn('loadHabits')(storage), 'loadHabits(empty storage)').toEqual([]);
  });
});

test('loadHabits throws an error caused by the parsing error', () => {
  withStored('{"schemaVersion":1,"records":[{"id":"h-01"', () => {
    const loadHabits = fn('loadHabits');
    const error = thrownBy(() => loadHabits(storage));
    expect(error, 'what loadHabits throws for unreadable text').not.toBeNull();
    expect(error?.cause instanceof SyntaxError, 'the cause is the SyntaxError from JSON.parse').toBe(true);
  });
});

test('loadHabits keeps unreadable text in the backup key', () => {
  const text = '{"schemaVersion":1,"records":[{"id":"h-01"';
  withStored(text, () => {
    const loadHabits = fn('loadHabits');
    thrownBy(() => loadHabits(storage));
    expect(storage.getItem(BACKUP), 'the backup key after loading unreadable text').toBe(text);
  });
});
