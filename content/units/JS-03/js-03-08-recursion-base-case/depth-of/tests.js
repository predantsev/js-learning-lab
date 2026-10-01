const box = (label, inner = null) => ({ label, inner });

// A pile of `count` boxes, each inside the next one.
const pile = (count) => {
  let current = null;
  for (let i = 0; i < count; i++) current = box('box ' + i, current);
  return current;
};

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('gives 0 when there is no box', () => {
  expect(scope.depthOf(null, 5), 'depthOf(null, 5)').toBe(0);
});

test('counts a single box', () => {
  expect(scope.depthOf(box('A'), 5), 'depthOf(one box, 5)').toBe(1);
});

test('counts nested boxes', () => {
  expect(scope.depthOf(pile(3), 10), 'depthOf(3 nested boxes, 10)').toBe(3);
  expect(scope.depthOf(pile(7), 10), 'depthOf(7 nested boxes, 10)').toBe(7);
});

test('stops at maxDepth', () => {
  expect(scope.depthOf(pile(3), 2), 'depthOf(3 nested boxes, 2)').toBe(2);
  expect(scope.depthOf(pile(3), 3), 'depthOf(3 nested boxes, 3)').toBe(3);
  expect(scope.depthOf(pile(3), 0), 'depthOf(3 nested boxes, 0)').toBe(0);
});

test('stops early on a very deep pile of boxes', () => {
  const deep = pile(100000);
  expect(scope.depthOf(deep, 50), 'depthOf(100000 nested boxes, 50)').toBe(50);
});

test('prints 3, 2 and 0', () => {
  expect(logs()).toEqual(['3', '2', '0']);
});
