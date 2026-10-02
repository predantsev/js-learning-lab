// Checks of capstone step JS-04, wishlist variant: addItem, updateItem and removeItem return new
// arrays, reuse untouched records, never change their inputs, and addItem only adds a draft that
// validateItem accepts. The page shows the list before and after three changes.
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
  { id: 'w-01', name: L.fixture1Name, price: 80, acquired: false, category: L.techCategory },
  { id: 'w-02', name: L.fixture2Name, price: 45, acquired: false, category: L.homeCategory },
  { id: 'w-03', name: L.fixture3Name, price: 240, acquired: false, category: L.sportCategory },
  { id: 'w-04', name: L.fixture4Name, price: 25, acquired: true, category: L.booksCategory },
  { id: 'w-05', name: L.fixture5Name, price: null, acquired: false, category: null },
  { id: 'w-06', name: L.fixture6Name, price: 18, acquired: true, category: L.homeCategory },
];
const sameObjects = (result, list, skip = -1) => Array.isArray(result) && result.every((item, i) => i === skip || item === list[i]);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the list before the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.fixture6Name];
  const lines = elementsWith(...names);
  expect(lines.length > 0, `an element inside <main> with the six names in order: ${names.join(', ')}`).toBe(true);
  expect(lines.some((node) => !inOrder(between(node.textContent, L.fixture2Name, L.fixture3Name), L.acquiredMark)), `"${L.fixture2Name}" without "${L.acquiredMark}" in the list before the changes`).toBe(true);
});

test('the page shows the list after the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.newName];
  const lines = elementsWith(...names).filter((node) => !inOrder(node.textContent, L.fixture6Name));
  expect(lines.length > 0, `an element inside <main> with ${names.join(', ')} in order and without "${L.fixture6Name}"`).toBe(true);
  expect(lines.some((node) => inOrder(between(node.textContent, L.fixture2Name, L.fixture3Name), L.acquiredMark)), `"${L.fixture2Name}" with "${L.acquiredMark}" in the list after the changes`).toBe(true);
});

test('items holds the six wishes and stays unchanged', () => {
  expect(scope.items, 'the list items after the page script ran').toEqual(fixtures());
});

test('addItem adds a checked wish to the end of a new list', () => {
  const list = fixtures();
  const result = scope.addItem(list, 'w-10', { name: '  Backpack ', price: 30 });
  expect(Array.isArray(result) && result !== list, 'addItem returns a new array').toBe(true);
  expect(result.length, 'the length of the new list').toBe(7);
  const added = result[6];
  expect([added?.id, added?.name, added?.price, added?.acquired, added?.category], 'the added wish: id, name, price, acquired, category').toEqual(['w-10', 'Backpack', 30, false, null]);
  expect(sameObjects(result.slice(0, 6), list), 'the six old wishes are the same objects in the new list').toBe(true);
  expect(list, 'the list addItem received').toEqual(fixtures());
  const first = scope.addItem([], 'w-11', { name: 'Backpack', price: null });
  expect(first?.length, 'addItem with an empty list: the length of the new list').toBe(1);
});

test('addItem keeps the list for a draft that fails the check', () => {
  const list = fixtures();
  const result = scope.addItem(list, 'w-12', { name: '', price: -5 });
  expect(result, 'addItem with the draft { name: "", price: -5 }').toEqual(fixtures());
  expect(sameObjects(result, list), 'the wishes in the result are the same objects').toBe(true);
  expect(list, 'the list addItem received').toEqual(fixtures());
});

test('updateItem changes only the given fields of one wish', () => {
  const list = fixtures();
  const result = scope.updateItem(list, 'w-02', { acquired: true });
  expect(Array.isArray(result) && result !== list, 'updateItem returns a new array').toBe(true);
  expect(result[1], 'the wish w-02 in the new list').toEqual({ ...fixtures()[1], acquired: true });
  expect(result[1] !== list[1], 'the changed wish is a new object').toBe(true);
  expect(sameObjects(result, list, 1), 'the other wishes are the same objects').toBe(true);
  expect(list, 'the list updateItem received and its wishes').toEqual(fixtures());
});

test('updateItem with a new price keeps the name and the category', () => {
  const list = fixtures();
  const result = scope.updateItem(list, 'w-01', { price: 70 });
  expect(result?.[0], 'the wish w-01 after updateItem(list, "w-01", { price: 70 })').toEqual({ ...fixtures()[0], price: 70 });
  expect(list[0].price, 'the price of w-01 in the list updateItem received').toBe(80);
});

test('updateItem with an unknown id keeps every wish', () => {
  const list = fixtures();
  const result = scope.updateItem(list, 'w-99', { price: 1 });
  expect(result, 'updateItem with the id "w-99"').toEqual(fixtures());
  expect(sameObjects(result, list), 'the wishes in the result are the same objects').toBe(true);
  expect(scope.updateItem([], 'w-01', { price: 1 }), 'updateItem with an empty list').toEqual([]);
});

test('removeItem removes only that wish', () => {
  const list = fixtures();
  const result = scope.removeItem(list, 'w-05');
  expect(Array.isArray(result) && result !== list, 'removeItem returns a new array').toBe(true);
  expect(result.map((item) => item.id), 'the ids in the new list').toEqual(['w-01', 'w-02', 'w-03', 'w-04', 'w-06']);
  expect(sameObjects(result, [list[0], list[1], list[2], list[3], list[5]]), 'the remaining wishes are the same objects').toBe(true);
  expect(list, 'the list removeItem received').toEqual(fixtures());
});

test('removeItem with an unknown id keeps every wish', () => {
  const list = fixtures();
  expect(scope.removeItem(list, 'w-99'), 'removeItem with the id "w-99"').toEqual(fixtures());
  expect(scope.removeItem([], 'w-01'), 'removeItem with an empty list').toEqual([]);
});
