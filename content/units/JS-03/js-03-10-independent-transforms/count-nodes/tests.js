const node = (label, left = null, right = null) => ({ label, left, right });
const smallTree = () => node('All', node('Food', node('Groceries'), node('Cafe')), node('Transport', null, node('Pass')));

// A tree that is one long left branch of `count` nodes.
const leftChain = (count) => {
  let current = null;
  for (let i = 0; i < count; i++) current = node('node ' + i, current, null);
  return current;
};

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('an empty tree has 0 nodes', () => {
  expect(scope.countNodes(null, 5), 'countNodes(null, 5)').toBe(0);
});

test('a single node counts as 1', () => {
  expect(scope.countNodes(node('Solo'), 5), 'countNodes(one node, 5)').toBe(1);
  expect(scope.countNodes(node('Solo'), 1), 'countNodes(one node, 1)').toBe(1);
});

test('counts every node of a small tree', () => {
  expect(scope.countNodes(smallTree(), 10), 'countNodes(six-node tree, 10)').toBe(6);
});

test('counts only the first maxDepth levels', () => {
  expect(scope.countNodes(smallTree(), 0), 'countNodes(tree, 0)').toBe(0);
  expect(scope.countNodes(smallTree(), 1), 'countNodes(tree, 1)').toBe(1);
  expect(scope.countNodes(smallTree(), 2), 'countNodes(tree, 2)').toBe(3);
  expect(scope.countNodes(smallTree(), 3), 'countNodes(tree, 3)').toBe(6);
});

test('counts both sides of the tree', () => {
  const rightLeaning = node('A', null, node('B', null, node('C')));
  expect(scope.countNodes(rightLeaning, 10), 'countNodes(right-leaning tree, 10)').toBe(3);
});

test('stops at the bound on a tree deeper than maxDepth', () => {
  expect(scope.countNodes(leftChain(100000), 20), 'countNodes(100000-level tree, 20)').toBe(20);
});

test('nothing is printed and the tree stays unchanged', () => {
  const before = logs().length;
  const tree = smallTree();
  scope.countNodes(tree, 10);
  expect(logs().length - before, 'lines printed by countNodes').toBe(0);
  expect(tree, 'the tree after countNodes').toEqual(smallTree());
});
