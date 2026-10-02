const flatten = () => {
  expect(typeof scope.flattenCategories, 'type of flattenCategories').toBe('function');
  return scope.flattenCategories;
};
const node = (id, name, children = []) => ({ id, name, children });
const chain = (levels) => {
  // Every level has its own name, so that only the ids can repeat.
  let current = node('c-' + levels, `${L.other} ${levels}`);
  for (let i = levels - 1; i >= 1; i--) current = node('c-' + i, `${L.other} ${i}`, [current]);
  return current;
};
const thrown = (run) => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
};
const sample = () =>
  node('k-all', L.all, [
    node('k-food', L.food, [node('k-groceries', L.groceries), node('k-cafe', L.cafe)]),
    node('k-fun', L.fun, [node('k-cinema', L.cinema)]),
  ]);

test('lists every category depth-first with its level', () => {
  expect(flatten()(sample(), 5), 'flattenCategories(tree, 5)').toEqual([
    { id: 'k-all', name: L.all, level: 1 },
    { id: 'k-food', name: L.food, level: 2 },
    { id: 'k-groceries', name: L.groceries, level: 3 },
    { id: 'k-cafe', name: L.cafe, level: 3 },
    { id: 'k-fun', name: L.fun, level: 2 },
    { id: 'k-cinema', name: L.cinema, level: 3 },
  ]);
});

test('a single category gives one entry', () => {
  expect(flatten()(node('k-all', L.all), 1), 'flattenCategories(one category, 1)').toEqual([{ id: 'k-all', name: L.all, level: 1 }]);
});

test('a tree exactly maxDepth levels deep is accepted', () => {
  const run = flatten();
  const error = thrown(() => run(chain(3), 3));
  expect(error === null ? null : `${error.name}: ${error.message}`, 'error for 3 levels with maxDepth 3').toBe(null);
  expect(run(chain(3), 3).map((entry) => entry.level), 'levels for 3 levels with maxDepth 3').toEqual([1, 2, 3]);
});

test('one level past maxDepth throws a RangeError naming that category', () => {
  const run = flatten();
  const error = thrown(() => run(chain(4), 3));
  expect(error?.name, 'error name for 4 levels with maxDepth 3').toBe('RangeError');
  expect(String(error.message).includes('c-4'), 'the message names c-4').toBe(true);
});

test('a cycle throws an Error naming the repeated category', () => {
  const run = flatten();
  const looped = chain(3);
  looped.children[0].children[0].children.push(looped);
  const error = thrown(() => run(looped, 10));
  expect(error instanceof Error, 'something derived from Error is thrown for a cycle').toBe(true);
  expect(error.name, 'error name for a cycle with maxDepth 10').toBe('Error');
  expect(String(error.message).includes('c-1'), 'the message names c-1').toBe(true);
});

test('two categories with the same name are not a cycle', () => {
  const tree = node('k-all', L.all, [
    node('k-fun', L.fun, [node('k-fun-other', L.other)]),
    node('k-home', L.home, [node('k-home-other', L.other)]),
  ]);
  const run = flatten();
  const error = thrown(() => run(tree, 5));
  expect(error === null ? null : `${error.name}: ${error.message}`, 'error for two different categories named the same').toBe(null);
  expect(run(tree, 5).length, 'entries for five categories').toBe(5);
});

test('the tree is not changed', () => {
  const tree = sample();
  const before = JSON.stringify(tree);
  flatten()(tree, 5);
  expect(JSON.stringify(tree), 'the tree after flattenCategories').toBe(before);
});
