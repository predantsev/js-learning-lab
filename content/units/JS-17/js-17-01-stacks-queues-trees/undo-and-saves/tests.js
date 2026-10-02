const fn = (name) => {
  expect(typeof scope[name], `type of ${name}`).toBe('function');
  return scope[name];
};
const saves = (ids) => ids.map((id) => ({ id }));

test('recordChange keeps every snapshot in order', () => {
  const history = [];
  fn('recordChange')(history, L.v1);
  fn('recordChange')(history, L.v2);
  expect(history, 'history after two changes').toEqual([L.v1, L.v2]);
});

test('undo gives the most recent change first', () => {
  const history = [L.v1, L.v2, L.v3];
  expect(fn('undo')(history), 'first undo').toBe(L.v3);
  expect(fn('undo')(history), 'second undo').toBe(L.v2);
  expect(history, 'history after two undos').toEqual([L.v1]);
});

test('undo on an empty history gives null', () => {
  expect(fn('undo')([]), 'undo([])').toBe(null);
});

test('saves leave the queue in the order they arrived', () => {
  const queue = [];
  fn('enqueueSave')(queue, { id: 'save-1' }, 5);
  fn('enqueueSave')(queue, { id: 'save-2' }, 5);
  expect(fn('nextSave')(queue)?.id, 'first nextSave').toBe('save-1');
  expect(fn('nextSave')(queue)?.id, 'second nextSave').toBe('save-2');
});

test('nextSave on an empty queue gives null', () => {
  expect(fn('nextSave')([]), 'nextSave([])').toBe(null);
});

test('a full queue drops the oldest save and returns it', () => {
  const queue = saves(['save-1', 'save-2', 'save-3']);
  const dropped = fn('enqueueSave')(queue, { id: 'save-4' }, 3);
  expect(dropped?.id, 'the save returned by enqueueSave').toBe('save-1');
  expect(queue.map((save) => save.id), 'the queue after adding save-4 with limit 3').toEqual(['save-2', 'save-3', 'save-4']);
});

test('a queue that reaches its limit drops nothing', () => {
  const queue = [];
  const results = ['save-1', 'save-2', 'save-3'].map((id) => fn('enqueueSave')(queue, { id }, 3));
  expect(results, 'what the three calls returned').toEqual([null, null, null]);
  expect(queue.map((save) => save.id), 'the queue after three saves with limit 3').toEqual(['save-1', 'save-2', 'save-3']);
});
