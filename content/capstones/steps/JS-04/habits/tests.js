// Checks of capstone step JS-04, habit tracker variant: addHabit, updateHabit, removeHabit and
// completeHabit return new arrays, reuse untouched records, never change their inputs (also not
// the shared completions arrays), and addHabit only adds a draft that validateHabit accepts.
// The page shows the list before and after three changes.
const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
/** The text between the first `a` and the next `b` (empty when either is missing). */
function between(text, a, b) {
  const t = norm(text);
  const start = t.indexOf(norm(a));
  if (start < 0) return '';
  const end = t.indexOf(norm(b), start + norm(a).length);
  return end < 0 ? '' : t.slice(start + norm(a).length, end);
}
const elementsWith = (...parts) => [...(screen.$('main')?.querySelectorAll('*') ?? [])].filter((node) => inOrder(node.textContent, ...parts));
const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
const sameObjects = (result, list, ...skip) => Array.isArray(result) && result.every((habit, i) => skip.includes(i) || habit === list[i]);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the list before the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.fixture6Name];
  const lines = elementsWith(...names);
  expect(lines.length > 0, `an element inside <main> with the six names in order: ${names.join(', ')}`).toBe(true);
  expect(lines.some((node) => !inOrder(between(node.textContent, L.fixture2Name, L.fixture3Name), L.pausedMark)), `"${L.fixture2Name}" without "${L.pausedMark}" in the list before the changes`).toBe(true);
});

test('the page shows the list after the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.newName];
  const lines = elementsWith(...names).filter((node) => !inOrder(node.textContent, L.fixture6Name));
  expect(lines.length > 0, `an element inside <main> with ${names.join(', ')} in order and without "${L.fixture6Name}"`).toBe(true);
  expect(lines.some((node) => inOrder(between(node.textContent, L.fixture2Name, L.fixture3Name), L.pausedMark)), `"${L.fixture2Name}" with "${L.pausedMark}" in the list after the changes`).toBe(true);
});

test('habits holds the six habits and stays unchanged', () => {
  expect(scope.habits, 'the list habits after the page script ran').toEqual(fixtures());
});

test('addHabit adds a checked habit to the end of a new list', () => {
  const list = fixtures();
  const result = scope.addHabit(list, 'h-10', { name: '  Stretching ', frequency: 'weekly' });
  expect(Array.isArray(result) && result !== list, 'addHabit returns a new array').toBe(true);
  expect(result.length, 'the length of the new list').toBe(7);
  const added = result[6];
  expect([added?.id, added?.name, added?.frequency, added?.active, added?.completions], 'the added habit: id, name, frequency, active, completions').toEqual(['h-10', 'Stretching', 'weekly', true, []]);
  expect(sameObjects(result.slice(0, 6), list), 'the six old habits are the same objects in the new list').toBe(true);
  expect(list, 'the list addHabit received').toEqual(fixtures());
  const first = scope.addHabit([], 'h-11', { name: 'Stretching' });
  const second = scope.addHabit([], 'h-12', { name: 'Stretching' });
  expect([first?.length, first?.[0]?.frequency], 'addHabit with an empty list and no frequency: length and frequency').toEqual([1, 'daily']);
  expect(first[0].completions !== second[0].completions, 'two new habits get two separate completions arrays').toBe(true);
});

test('addHabit keeps the list for a draft that fails the check', () => {
  const list = fixtures();
  const result = scope.addHabit(list, 'h-13', { name: '', frequency: 'monthly' });
  expect(result, 'addHabit with the draft { name: "", frequency: "monthly" }').toEqual(fixtures());
  expect(sameObjects(result, list), 'the habits in the result are the same objects').toBe(true);
  expect(list, 'the list addHabit received').toEqual(fixtures());
});

test('updateHabit changes only the given fields of one habit', () => {
  const list = fixtures();
  const result = scope.updateHabit(list, 'h-02', { active: false });
  expect(Array.isArray(result) && result !== list, 'updateHabit returns a new array').toBe(true);
  expect(result[1], 'the habit h-02 in the new list').toEqual({ ...fixtures()[1], active: false });
  expect(result[1] !== list[1], 'the changed habit is a new object').toBe(true);
  expect(sameObjects(result, list, 1), 'the other habits are the same objects').toBe(true);
  expect(list, 'the list updateHabit received and its habits').toEqual(fixtures());
});

test('updateHabit with a new frequency keeps the name and the completions', () => {
  const list = fixtures();
  const result = scope.updateHabit(list, 'h-04', { frequency: 'daily' });
  expect(result?.[3], 'the habit h-04 after updateHabit(list, "h-04", { frequency: "daily" })').toEqual({ ...fixtures()[3], frequency: 'daily' });
  expect(list[3].frequency, 'the frequency of h-04 in the list updateHabit received').toBe('weekly');
});

test('updateHabit with an unknown id keeps every habit', () => {
  const list = fixtures();
  const result = scope.updateHabit(list, 'h-99', { active: false });
  expect(result, 'updateHabit with the id "h-99"').toEqual(fixtures());
  expect(sameObjects(result, list), 'the habits in the result are the same objects').toBe(true);
  expect(scope.updateHabit([], 'h-01', { active: false }), 'updateHabit with an empty list').toEqual([]);
});

test('removeHabit removes only that habit', () => {
  const list = fixtures();
  const result = scope.removeHabit(list, 'h-05');
  expect(Array.isArray(result) && result !== list, 'removeHabit returns a new array').toBe(true);
  expect(result.map((habit) => habit.id), 'the ids in the new list').toEqual(['h-01', 'h-02', 'h-03', 'h-04', 'h-06']);
  expect(sameObjects(result, [list[0], list[1], list[2], list[3], list[5]]), 'the remaining habits are the same objects').toBe(true);
  expect(list, 'the list removeHabit received').toEqual(fixtures());
});

test('removeHabit with an unknown id keeps every habit', () => {
  const list = fixtures();
  expect(scope.removeHabit(list, 'h-99'), 'removeHabit with the id "h-99"').toEqual(fixtures());
  expect(scope.removeHabit([], 'h-01'), 'removeHabit with an empty list').toEqual([]);
});

test('completeHabit adds the day to a new completions array', () => {
  const list = fixtures();
  const result = scope.completeHabit(list, 'h-03', '2026-03-02');
  expect(Array.isArray(result) && result !== list, 'completeHabit returns a new array').toBe(true);
  expect(result[2], 'the habit h-03 in the new list').toEqual({ ...fixtures()[2], completions: ['2026-03-01', '2026-03-02'] });
  expect(result[2] !== list[2], 'the completed habit is a new object').toBe(true);
  expect(result[2].completions !== list[2].completions, 'the completed habit has a new completions array').toBe(true);
  expect(sameObjects(result, list, 2), 'the other habits are the same objects').toBe(true);
  expect(list, 'the list completeHabit received, its habits and their completions').toEqual(fixtures());
  const fresh = scope.completeHabit(list, 'h-06', '2026-03-02');
  expect(fresh?.[5]?.completions, 'the completions of h-06 (none before) after completeHabit').toEqual(['2026-03-02']);
  expect(list[5].completions, 'the completions of h-06 in the list completeHabit received').toEqual([]);
});

test('completeHabit does not add a day twice', () => {
  const list = fixtures();
  const result = scope.completeHabit(list, 'h-01', '2026-03-01');
  expect(result?.[0]?.completions, 'the completions of h-01 after completeHabit(list, "h-01", "2026-03-01")').toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  expect(list, 'the list completeHabit received').toEqual(fixtures());
});

test('completeHabit with an unknown id keeps every habit', () => {
  const list = fixtures();
  const result = scope.completeHabit(list, 'h-99', '2026-03-02');
  expect(result, 'completeHabit with the id "h-99"').toEqual(fixtures());
  expect(sameObjects(result, list), 'the habits in the result are the same objects').toBe(true);
  expect(list, 'the list completeHabit received').toEqual(fixtures());
});
