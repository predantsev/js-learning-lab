// Checks of capstone step JS-03, planner variant: the pure functions formatTaskLabel and
// validateTask (domain contract: { ok: true, value } or { ok: false, errors: { field: key } }),
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
const task = (fields) => ({ id: 't-90', title: 'Buy bread', dueDate: '2026-03-05', done: false, priority: 'normal', ...fields });
/** A value as it would be written in code, for check messages. */
const show = (value) => (value === undefined ? 'missing' : Number.isNaN(value) ? 'NaN' : JSON.stringify(value));
const PRIORITY_WORDS = { low: () => L.priorityLow, normal: () => L.priorityNormal, high: () => L.priorityHigh };

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the labels and the draft messages', () => {
  expect(shown(L.nameValue, L.firstCheck), `a line with "${L.nameValue}" and then "${L.firstCheck}"`).toBe(true);
  expect(shown(L.secondName, L.noDueDate), `a line with "${L.secondName}" and then "${L.noDueDate}"`).toBe(true);
  expect(shown(L.requiredMessage), `a line with "${L.requiredMessage}"`).toBe(true);
  expect(shown(L.invalidMessage), `a line with "${L.invalidMessage}"`).toBe(true);
});

test('formatTaskLabel returns the title and the due date', () => {
  const label = scope.formatTaskLabel(task({ title: 'Buy bread', dueDate: '2026-03-05' }));
  expect(typeof label, 'the type of what formatTaskLabel returns').toBe('string');
  expect(inOrder(label, 'Buy bread', '2026-03-05'), `formatTaskLabel(title "Buy bread", due date "2026-03-05") returned ${show(label)}`).toBe(true);
});

test('formatTaskLabel uses the no-due-date text for a missing due date', () => {
  const label = scope.formatTaskLabel(task({ title: 'Call the bank', dueDate: null }));
  expect(inOrder(label, 'Call the bank', L.noDueDate), `due date null: ${show(label)}`).toBe(true);
});

test('formatTaskLabel names the priority in words', () => {
  for (const priority of ['low', 'normal', 'high']) {
    const label = scope.formatTaskLabel(task({ priority }));
    const word = PRIORITY_WORDS[priority]();
    const others = Object.keys(PRIORITY_WORDS).filter((p) => p !== priority).map((p) => PRIORITY_WORDS[p]());
    expect(inOrder(label, 'Buy bread', word) && others.every((other) => !inOrder(label, other)), `priority "${priority}": ${show(label)}`).toBe(true);
  }
});

test('validateTask accepts a valid task and trims its title', () => {
  const result = scope.validateTask({ title: '  Buy bread  ', dueDate: '2026-03-05', priority: 'high' });
  expect(result?.ok, 'validateTask({ title: "  Buy bread  ", dueDate: "2026-03-05", priority: "high" }).ok').toBe(true);
  expect(result.value?.title, 'value.title').toBe('Buy bread');
  expect(result.value?.dueDate, 'value.dueDate').toBe('2026-03-05');
  expect(result.value?.priority, 'value.priority').toBe('high');
  expect(scope.validateTask({ title: 'x'.repeat(80), priority: 'low' })?.ok, 'a title of exactly 80 characters is valid').toBe(true);
});

test('validateTask fills in the defaults', () => {
  const result = scope.validateTask({ title: 'Buy bread' });
  expect(result?.ok, 'a draft with only a title is valid').toBe(true);
  expect(result.value?.priority, 'value.priority when there is no priority field').toBe('normal');
  expect(result.value?.dueDate, 'value.dueDate when there is no dueDate field').toBeNull();
  expect(scope.validateTask({ title: 'Buy bread', dueDate: null, priority: null }).value?.priority, 'value.priority for priority null').toBe('normal');
});

test('validateTask requires a title', () => {
  for (const title of ['', '   ', undefined]) {
    const result = scope.validateTask({ title, priority: 'normal' });
    expect(result?.ok, `title ${show(title)}: ok`).toBe(false);
    expect(result.errors?.title, `title ${show(title)}: errors.title`).toBe('required');
  }
});

test('validateTask rejects a title longer than 80 characters', () => {
  const result = scope.validateTask({ title: 'x'.repeat(81), priority: 'normal' });
  expect(result?.ok, 'a title of 81 characters: ok').toBe(false);
  expect(result.errors?.title, 'a title of 81 characters: errors.title').toBe('too-long');
  expect(scope.validateTask({ title: `  ${'x'.repeat(80)}  `, priority: 'normal' })?.ok, '80 characters plus spaces at the edges is valid').toBe(true);
});

test('validateTask rejects an unknown priority', () => {
  for (const priority of ['urgent', 'HIGH', '']) {
    const result = scope.validateTask({ title: 'Buy bread', priority });
    expect(result?.ok, `priority ${show(priority)}: ok`).toBe(false);
    expect(result.errors?.priority, `priority ${show(priority)}: errors.priority`).toBe('unknown');
  }
});

test('validateTask lists every field with a problem and only those', () => {
  const both = scope.validateTask({ title: '', priority: 'urgent' });
  expect(both?.ok, 'empty title and priority "urgent": ok').toBe(false);
  expect(both.errors, 'empty title and priority "urgent": errors').toEqual({ title: 'required', priority: 'unknown' });
  const one = scope.validateTask({ title: 'Buy bread', priority: 'urgent' });
  expect(one.errors, 'a good title and priority "urgent": errors').toEqual({ priority: 'unknown' });
});

test('the functions only return values', () => {
  // Data no other check uses, so that a write to the page shows up as a change; every branch is
  // visited (a valid and an invalid draft, a task with and without a due date).
  const page = screen.$('main')?.innerHTML;
  const printed = logs().length;
  const tasks = [task({ title: 'Purity probe', dueDate: '2026-04-07', priority: 'low' }), task({ title: 'Purity probe', dueDate: null, priority: 'high' })];
  const drafts = [{ title: '  Purity probe ', dueDate: '2026-04-07', priority: 'low' }, { title: ' ', priority: 'urgent' }];
  for (const one of tasks) {
    const label = scope.formatTaskLabel(one);
    expect(scope.formatTaskLabel(one), `formatTaskLabel called twice with ${show(one)}`).toBe(label);
  }
  for (const draft of drafts) {
    const result = scope.validateTask(draft);
    expect(scope.validateTask(draft), `validateTask called twice with ${show(draft)}`).toEqual(result);
  }
  expect(tasks, 'the tasks after formatTaskLabel').toEqual([task({ title: 'Purity probe', dueDate: '2026-04-07', priority: 'low' }), task({ title: 'Purity probe', dueDate: null, priority: 'high' })]);
  expect(drafts, 'the drafts after validateTask').toEqual([{ title: '  Purity probe ', dueDate: '2026-04-07', priority: 'low' }, { title: ' ', priority: 'urgent' }]);
  expect(logs().length - printed, 'lines printed by the functions').toBe(0);
  expect(screen.$('main')?.innerHTML, 'the page after calling the functions').toBe(page);
});
