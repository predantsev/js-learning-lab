const wishes = () => [
  { id: "w-01", name: L.headphones, price: 80, acquired: false },
  { id: "w-02", name: L.lamp, price: 45, acquired: false },
  { id: "w-05", name: L.tickets, price: null, acquired: false },
  { id: "w-06", name: L.mug, price: 18, acquired: true },
];
const tasks = () => [
  { id: "t-01", title: L.water, dueDate: "2026-03-02", done: false },
  { id: "t-03", title: L.grandma, dueDate: null, done: false },
  { id: "t-02", title: L.books, dueDate: "2026-03-01", done: false },
  { id: "t-04", title: L.internet, dueDate: "2026-02-27", done: true },
];
const expenses = () => [
  { id: "e-01", label: L.groceries, amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: L.transit, amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-04", label: L.bulbs, amountMinor: 9990, date: "2026-02-27", category: "home" },
  { id: "e-05", label: L.cinema, amountMinor: 30000, date: "2026-02-27", category: "fun" },
];
const ids = (list) => (Array.isArray(list) ? list.map((record) => record.id) : list);

test('searchByText ignores upper and lower case', () => {
  expect(ids(scope.searchByText(wishes(), 'name', L.queryUpper)), `searchByText(wishes, "name", "${L.queryUpper}")`).toEqual(['w-02']);
  expect(ids(scope.searchByText(tasks(), 'title', L.queryTask)), `searchByText(tasks, "title", "${L.queryTask}")`).toEqual(['t-02']);
});

test('searchByText with an empty query keeps every record', () => {
  expect(ids(scope.searchByText(expenses(), 'label', '')), 'searchByText(expenses, "label", "")').toEqual(['e-01', 'e-02', 'e-04', 'e-05']);
});

test('searchByText returns an empty array when nothing matches', () => {
  expect(scope.searchByText(tasks(), 'title', 'xyz'), 'searchByText(tasks, "title", "xyz")').toEqual([]);
});

test('filterByStatus keeps exactly the records with that value', () => {
  expect(ids(scope.filterByStatus(wishes(), 'acquired', false)), 'filterByStatus(wishes, "acquired", false)').toEqual(['w-01', 'w-02', 'w-05']);
  expect(ids(scope.filterByStatus(tasks(), 'done', true)), 'filterByStatus(tasks, "done", true)').toEqual(['t-04']);
  expect(ids(scope.filterByStatus(expenses(), 'category', 'fun')), 'filterByStatus(expenses, "category", "fun")').toEqual(['e-05']);
});

test('sortBy orders numbers from smallest to largest', () => {
  expect(ids(scope.sortBy(expenses(), 'amountMinor')), 'sortBy(expenses, "amountMinor")').toEqual(['e-04', 'e-05', 'e-02', 'e-01']);
});

test('sortBy orders text alphabetically', () => {
  const list = [
    { id: 'p', name: L.mug },
    { id: 'q', name: L.aidKit },
    { id: 'r', name: L.bicycle },
  ];
  expect(ids(scope.sortBy(list, 'name')), 'sortBy(list, "name")').toEqual(['q', 'r', 'p']);
});

test('sortBy puts null values last', () => {
  expect(ids(scope.sortBy(wishes(), 'price')), 'sortBy(wishes, "price")').toEqual(['w-06', 'w-02', 'w-01', 'w-05']);
  expect(ids(scope.sortBy(tasks(), 'dueDate')), 'sortBy(tasks, "dueDate")').toEqual(['t-04', 't-02', 't-01', 't-03']);
});

test('sortBy keeps the order of records with equal values', () => {
  expect(ids(scope.sortBy(expenses(), 'date')), 'sortBy(expenses, "date")').toEqual(['e-04', 'e-05', 'e-01', 'e-02']);
});

test('sortBy returns a new array and leaves the input as it was', () => {
  const list = expenses();
  const sorted = scope.sortBy(list, 'amountMinor');
  expect(sorted !== list, 'sortBy returned a different array').toBe(true);
  expect(ids(list), 'ids of the input after sortBy').toEqual(['e-01', 'e-02', 'e-04', 'e-05']);
});

test('summarize counts each id once', () => {
  const list = [...wishes(), wishes()[0]];
  expect(scope.summarize(list, 'price'), 'summarize(wishes with w-01 twice, "price")').toEqual({ count: 4, total: 143, missing: 1 });
});

test('summarize adds up the field and counts missing values', () => {
  expect(scope.summarize(wishes(), 'price'), 'summarize(wishes, "price")').toEqual({ count: 4, total: 143, missing: 1 });
  expect(scope.summarize(expenses(), 'amountMinor'), 'summarize(expenses, "amountMinor")').toEqual({ count: 4, total: 176540, missing: 0 });
});

test('summarize of an empty list is all zeros', () => {
  expect(scope.summarize([], 'price'), 'summarize([], "price")').toEqual({ count: 0, total: 0, missing: 0 });
});

test('no function changes the list it gets', () => {
  const list = wishes();
  scope.searchByText(list, 'name', '');
  scope.filterByStatus(list, 'acquired', true);
  scope.sortBy(list, 'price');
  scope.summarize(list, 'price');
  expect(list, 'the wishes after all four calls').toEqual(wishes());
});
