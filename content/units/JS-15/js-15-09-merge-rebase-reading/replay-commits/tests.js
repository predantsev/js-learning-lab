import { commitId } from './history.js';

// Three commits of a planner branch, oldest first, sitting on `oldBase`.
const oldBase = commitId('', 'Add the task list');
const newBase = commitId(oldBase, 'Count tasks that are due');
const makeBranch = () => {
  const a = { id: commitId(oldBase, 'Add a due date'), parent: oldBase, message: 'Add a due date' };
  const b = { id: commitId(a.id, 'Sort tasks by priority'), parent: a.id, message: 'Sort tasks by priority' };
  const c = { id: commitId(b.id, 'Test the priority sort'), parent: b.id, message: 'Test the priority sort' };
  return [a, b, c];
};
const replay = (commits) => {
  expect(typeof scope.rebase, 'rebase').toBe('function');
  const result = scope.rebase(commits, newBase);
  expect(Array.isArray(result), 'what rebase returns is an array').toBe(true);
  expect(result, 'the replayed commits').toHaveLength(commits.length);
  return result;
};

test('the first replayed commit sits on ontoId', () => {
  const result = replay(makeBranch());
  expect(result[0].parent, 'parent of the first replayed commit').toBe(newBase);
});

test('each later commit sits on the replayed commit before it', () => {
  const result = replay(makeBranch());
  expect(result[1].parent, 'parent of the second replayed commit').toBe(result[0].id);
  expect(result[2].parent, 'parent of the third replayed commit').toBe(result[1].id);
});

test('every replayed commit gets the id commitId computes from its new parent', () => {
  const result = replay(makeBranch());
  for (const commit of result) {
    expect(commit.id, `id of "${commit.message}"`).toBe(commitId(commit.parent, commit.message));
  }
});

test('no replayed commit keeps its old id', () => {
  const original = makeBranch();
  const oldIds = original.map((commit) => commit.id);
  const result = replay(makeBranch());
  for (const commit of result) {
    expect(oldIds.includes(commit.id), `"${commit.message}" still has an old id`).toBe(false);
  }
});

test('messages keep their order', () => {
  const result = replay(makeBranch());
  expect(result.map((commit) => commit.message)).toEqual(['Add a due date', 'Sort tasks by priority', 'Test the priority sort']);
});

test('the original commits are not changed', () => {
  const commits = makeBranch();
  const before = JSON.stringify(commits);
  replay(commits);
  expect(JSON.stringify(commits), 'the commits passed to rebase').toBe(before);
});
