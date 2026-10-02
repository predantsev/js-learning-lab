import { saveTasks, saveFilter, saveDraft } from './planner.js';

const PLANNER = [
  ['jsll.planner.v1', 'localStorage'],
  ['jsll.planner.filter', 'localStorage'],
  ['jsll.planner.draft', 'sessionStorage'],
];

function fillStorage() {
  saveTasks([{ id: 't-02', title: L.returnBooks, dueDate: '2026-03-01', done: false, priority: 'high' }]);
  saveFilter('done');
  saveDraft(L.draft);
  // Data of other apps opened at the same address.
  localStorage.setItem('jsll.wishlist.v1', '{"schemaVersion":1,"records":[]}');
  localStorage.setItem('theme', 'dark');
  sessionStorage.setItem('jsll.wishlist.draft', 'x');
}

test('the inventory lists every key the planner keeps, with its storage', () => {
  const inventory = scope.STORAGE_INVENTORY;
  expect(Array.isArray(inventory), 'STORAGE_INVENTORY is an array').toBe(true);
  const listed = inventory.map((entry) => [entry.key, entry.storage]).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  expect(listed, 'keys and storages in STORAGE_INVENTORY').toEqual([...PLANNER].sort((a, b) => a[0].localeCompare(b[0], 'en')));
});

test('every inventory entry says what it holds, why and for how long', () => {
  for (const entry of scope.STORAGE_INVENTORY ?? []) {
    for (const field of ['holds', 'why', 'lifetime']) {
      expect(typeof entry[field] === 'string' && entry[field].trim().length > 0, `${field} of ${entry.key}`).toBe(true);
    }
  }
  expect((scope.STORAGE_INVENTORY ?? []).length, 'number of entries').toBe(3);
});

test('clearAll removes every planner key from its storage', () => {
  expect(typeof scope.clearAll, 'type of clearAll').toBe('function');
  fillStorage();
  scope.clearAll();
  expect(localStorage.getItem('jsll.planner.v1'), 'jsll.planner.v1 after clearAll').toBeNull();
  expect(localStorage.getItem('jsll.planner.filter'), 'jsll.planner.filter after clearAll').toBeNull();
  expect(sessionStorage.getItem('jsll.planner.draft'), 'jsll.planner.draft after clearAll').toBeNull();
});

test('clearAll keeps the data of other apps', () => {
  expect(typeof scope.clearAll, 'type of clearAll').toBe('function');
  fillStorage();
  scope.clearAll();
  expect(localStorage.getItem('jsll.wishlist.v1'), 'the wishlist key of another app').toBe('{"schemaVersion":1,"records":[]}');
  expect(localStorage.getItem('theme'), 'the theme key of another app').toBe('dark');
  expect(sessionStorage.getItem('jsll.wishlist.draft'), 'the session key of another app').toBe('x');
});

test('the button clears the planner data and says so', async () => {
  fillStorage();
  await user.click(screen.byRole('button', { name: L.clearButton }));
  expect(localStorage.getItem('jsll.planner.v1'), 'jsll.planner.v1 after the click').toBeNull();
  expect(sessionStorage.getItem('jsll.planner.draft'), 'jsll.planner.draft after the click').toBeNull();
  expect(screen.$('#status').textContent, 'the status text').toBe(L.cleared);
});
