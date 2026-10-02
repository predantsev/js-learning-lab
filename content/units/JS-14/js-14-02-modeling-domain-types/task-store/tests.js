const ready = () => expect(typeof scope.createMemoryStore, 'type of createMemoryStore').toBe('function');

const sample = () => [
  { id: 't-02', title: L.books, dueDate: '2026-03-01', done: false },
  { id: 't-05', title: L.dentist, dueDate: null, done: false },
];

test('list gives all tasks as a new array', () => {
  ready();
  const store = scope.createMemoryStore(sample());
  expect(typeof store.list, 'type of store.list').toBe('function');
  const listed = store.list();
  expect(listed.map((task) => task.id), 'ids from store.list()').toEqual(['t-02', 't-05']);
  listed.pop();
  expect(store.list(), 'store.list() after changing the array it returned before').toHaveLength(2);
});

test('get finds a task by id and gives undefined for an unknown id', () => {
  ready();
  const store = scope.createMemoryStore(sample());
  expect(store.get('t-05')?.title, 'store.get("t-05").title').toBe(L.dentist);
  expect(store.get('t-99'), 'store.get("t-99")').toBeUndefined();
});

test('save replaces the task with the same id instead of adding a second one', () => {
  ready();
  const store = scope.createMemoryStore(sample());
  store.save({ id: 't-02', title: L.books, dueDate: '2026-03-01', done: true });
  store.save({ id: 't-06', title: L.wardrobe, dueDate: null, done: false });
  const listed = store.list();
  expect(listed.map((task) => task.id).sort(), 'ids after two saves').toEqual(['t-02', 't-05', 't-06']);
  expect(store.get('t-02')?.done, 'done of t-02 after saving it as done').toBe(true);
});

test('the program prints t-03 false, t-01 true', () => {
  expect(logs(), 'the console of the program').toEqual(['t-03 false, t-01 true']);
});
