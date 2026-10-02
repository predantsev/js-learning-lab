const sample = () => [
  { id: "t-01", title: L.water, dueDate: "2026-03-02", done: false },
  { id: "t-02", title: L.books, dueDate: "2026-03-01", done: false },
  { id: "t-03", title: L.grandma, dueDate: null, done: false },
  { id: "t-04", title: L.internet, dueDate: "2026-02-27", done: true },
  { id: "t-05", title: L.dentist, dueDate: "2026-03-10", done: false },
];
const label = (title, date) => title + ' · ' + date;

// The loop from the starter, kept here so the chain is compared with it even if the learner deletes it.
const reference = (list, query) => {
  const found = [];
  for (const task of list) {
    if (!task.done && task.title.toLowerCase().includes(query.toLowerCase())) found.push(task);
  }
  found.sort((a, b) => {
    if (a.dueDate === b.dueDate) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  return found.map((task) => label(task.title, task.dueDate ?? L.noDate));
};

test('isPending is true only for tasks not done yet', () => {
  const list = sample();
  expect(scope.isPending(list[0]), 'isPending(a task not done)').toBe(true);
  expect(scope.isPending(list[3]), 'isPending(a done task)').toBe(false);
});

test('matchesQuery finds the query anywhere in the title, in any case', () => {
  const books = sample()[1];
  expect(scope.matchesQuery(books, L.queryUpper), `matchesQuery(books, "${L.queryUpper}")`).toBe(true);
  expect(scope.matchesQuery(books, L.queryMiddle), `matchesQuery(books, "${L.queryMiddle}")`).toBe(true);
  expect(scope.matchesQuery(books, 'xyz'), 'matchesQuery(books, "xyz")').toBe(false);
});

test('byDueDate puts earlier dates first and tasks without a due date last', () => {
  const ids = sample().toSorted(scope.byDueDate).map((task) => task.id);
  expect(ids, 'ids sorted with byDueDate').toEqual(['t-04', 't-02', 't-01', 't-05', 't-03']);
});

test('toLabel makes the title · due date label', () => {
  const list = sample();
  expect(scope.toLabel(list[1]), 'toLabel(books)').toBe(label(L.books, '2026-03-01'));
  expect(scope.toLabel(list[2]), 'toLabel(a task without a due date)').toBe(label(L.grandma, L.noDate));
});

test('pendingLabels gives the same labels as the loop', () => {
  for (const query of ['', L.queryMulti, L.queryUpper, 'xyz']) {
    expect(scope.pendingLabels(sample(), query), `pendingLabels(list, "${query}")`).toEqual(reference(sample(), query));
  }
});

test('pendingLabels does not change the list', () => {
  const list = sample();
  scope.pendingLabels(list, '');
  expect(list, 'the list after pendingLabels').toEqual(sample());
});
