// Checks of capstone step JS-03, habit tracker variant: the pure functions formatHabitLabel and
// validateHabit (domain contract: { ok: true, value } or { ok: false, errors: { field: key } }),
// and the page that only shows their results. Text comes from L (the project's language).
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
const shown = (...parts) => [...(screen.$('main')?.querySelectorAll('*') ?? [])].some((node) => inOrder(node.textContent, ...parts));
const habit = (fields) => ({ id: 'h-90', name: 'Stretching', frequency: 'daily', active: true, ...fields });
/** A value as it would be written in code, for check messages. */
const show = (value) => (value === undefined ? 'missing' : Number.isNaN(value) ? 'NaN' : JSON.stringify(value));

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the labels and the draft messages', () => {
  expect(shown(L.nameValue, L.daily), `a line with "${L.nameValue}" and then "${L.daily}"`).toBe(true);
  expect(shown(L.secondName, L.weekly), `a line with "${L.secondName}" and then "${L.weekly}"`).toBe(true);
  expect(shown(L.requiredMessage), `a line with "${L.requiredMessage}"`).toBe(true);
  expect(shown(L.invalidMessage), `a line with "${L.invalidMessage}"`).toBe(true);
});

test('formatHabitLabel returns the name and the frequency in words', () => {
  const daily = scope.formatHabitLabel(habit({ name: 'Stretching', frequency: 'daily' }));
  expect(typeof daily, 'the type of what formatHabitLabel returns').toBe('string');
  expect(inOrder(daily, 'Stretching', L.daily) && !inOrder(daily, L.weekly), `frequency "daily": ${show(daily)}`).toBe(true);
  const weekly = scope.formatHabitLabel(habit({ name: 'Stretching', frequency: 'weekly' }));
  expect(inOrder(weekly, 'Stretching', L.weekly) && !inOrder(weekly, L.daily), `frequency "weekly": ${show(weekly)}`).toBe(true);
});

test('formatHabitLabel marks paused habits', () => {
  const paused = scope.formatHabitLabel(habit({ active: false }));
  const active = scope.formatHabitLabel(habit({ active: true }));
  expect(inOrder(paused, 'Stretching', L.pausedMark), `active false: ${show(paused)}`).toBe(true);
  expect(inOrder(active, L.pausedMark), `active true: ${show(active)}`).toBe(false);
});

test('validateHabit accepts a valid habit and trims its name', () => {
  const result = scope.validateHabit({ name: '  Stretching  ', frequency: 'weekly' });
  expect(result?.ok, 'validateHabit({ name: "  Stretching  ", frequency: "weekly" }).ok').toBe(true);
  expect(result.value?.name, 'value.name').toBe('Stretching');
  expect(result.value?.frequency, 'value.frequency').toBe('weekly');
  expect(scope.validateHabit({ name: 'x'.repeat(80), frequency: 'daily' })?.ok, 'a name of exactly 80 characters is valid').toBe(true);
});

test('validateHabit fills in the default frequency', () => {
  const result = scope.validateHabit({ name: 'Stretching' });
  expect(result?.ok, 'a draft with only a name is valid').toBe(true);
  expect(result.value?.frequency, 'value.frequency when there is no frequency field').toBe('daily');
  expect(scope.validateHabit({ name: 'Stretching', frequency: null }).value?.frequency, 'value.frequency for frequency null').toBe('daily');
});

test('validateHabit requires a name', () => {
  for (const name of ['', '   ', undefined]) {
    const result = scope.validateHabit({ name, frequency: 'daily' });
    expect(result?.ok, `name ${show(name)}: ok`).toBe(false);
    expect(result.errors?.name, `name ${show(name)}: errors.name`).toBe('required');
  }
});

test('validateHabit rejects a name longer than 80 characters', () => {
  const result = scope.validateHabit({ name: 'x'.repeat(81), frequency: 'daily' });
  expect(result?.ok, 'a name of 81 characters: ok').toBe(false);
  expect(result.errors?.name, 'a name of 81 characters: errors.name').toBe('too-long');
  expect(scope.validateHabit({ name: `  ${'x'.repeat(80)}  `, frequency: 'daily' })?.ok, '80 characters plus spaces at the edges is valid').toBe(true);
});

test('validateHabit rejects an unknown frequency', () => {
  for (const frequency of ['monthly', 'Daily', '']) {
    const result = scope.validateHabit({ name: 'Stretching', frequency });
    expect(result?.ok, `frequency ${show(frequency)}: ok`).toBe(false);
    expect(result.errors?.frequency, `frequency ${show(frequency)}: errors.frequency`).toBe('unknown');
  }
});

test('validateHabit lists every field with a problem and only those', () => {
  const both = scope.validateHabit({ name: '', frequency: 'monthly' });
  expect(both?.ok, 'empty name and frequency "monthly": ok').toBe(false);
  expect(both.errors, 'empty name and frequency "monthly": errors').toEqual({ name: 'required', frequency: 'unknown' });
  const one = scope.validateHabit({ name: 'Stretching', frequency: 'monthly' });
  expect(one.errors, 'a good name and frequency "monthly": errors').toEqual({ frequency: 'unknown' });
});

test('the functions only return values', () => {
  // Data no other check uses, so that a write to the page shows up as a change; every branch is
  // visited (a valid and an invalid draft, an active and a paused habit, both frequencies).
  const page = screen.$('main')?.innerHTML;
  const printed = logs().length;
  const habits = [habit({ name: 'Purity probe', frequency: 'daily', active: true }), habit({ name: 'Purity probe', frequency: 'weekly', active: false })];
  const drafts = [{ name: '  Purity probe ', frequency: 'weekly' }, { name: ' ', frequency: 'yearly' }];
  for (const one of habits) {
    const label = scope.formatHabitLabel(one);
    expect(scope.formatHabitLabel(one), `formatHabitLabel called twice with ${show(one)}`).toBe(label);
  }
  for (const draft of drafts) {
    const result = scope.validateHabit(draft);
    expect(scope.validateHabit(draft), `validateHabit called twice with ${show(draft)}`).toEqual(result);
  }
  expect(habits, 'the habits after formatHabitLabel').toEqual([habit({ name: 'Purity probe', frequency: 'daily', active: true }), habit({ name: 'Purity probe', frequency: 'weekly', active: false })]);
  expect(drafts, 'the drafts after validateHabit').toEqual([{ name: '  Purity probe ', frequency: 'weekly' }, { name: ' ', frequency: 'yearly' }]);
  expect(logs().length - printed, 'lines printed by the functions').toBe(0);
  expect(screen.$('main')?.innerHTML, 'the page after calling the functions').toBe(page);
});
