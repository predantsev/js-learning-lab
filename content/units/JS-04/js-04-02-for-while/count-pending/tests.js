const task = (id, done) => ({ id, title: id, done });

test('counts the pending tasks', () => {
  const tasks = [task('t-01', false), task('t-04', true), task('t-03', false)];
  expect(scope.countPending(tasks), 'countPending for three tasks, two of them pending').toBe(2);
});

test('returns 0 for an empty list', () => {
  expect(scope.countPending([]), 'countPending([])').toBe(0);
});

test('counts a pending task at the start', () => {
  const tasks = [task('t-02', false), task('t-04', true), task('t-06', true)];
  expect(scope.countPending(tasks), 'only the first task is pending').toBe(1);
});

test('counts a pending task at the end', () => {
  const tasks = [task('t-04', true), task('t-06', true), task('t-05', false)];
  expect(scope.countPending(tasks), 'only the last task is pending').toBe(1);
});

test('works for a single task', () => {
  expect(scope.countPending([task('t-01', false)]), 'one pending task').toBe(1);
  expect(scope.countPending([task('t-04', true)]), 'one finished task').toBe(0);
});
