// Both repositories get the same synthetic tasks: a JSON file in .tmp/ and an in-memory SQLite table.
import { tasks, writeTasksFile, createTasksDb } from './fixtures.js';
import { createFileRepo, createSqlRepo, choice } from './repos.js';

const expected = {
  pending: ['t-02', 't-01', 't-07', 't-05', 't-03'], // t-07 is stored first but has the date of t-01
  done: ['t-04', 't-06'],
};
let files = 0;
async function fileRepo() {
  expect(typeof createFileRepo, 'type of createFileRepo').toBe('function');
  const path = tmp(`tasks-${++files}.json`);
  await writeTasksFile(path);
  return createFileRepo(path);
}
function sqlRepo() {
  expect(typeof createSqlRepo, 'type of createSqlRepo').toBe('function');
  return createSqlRepo(createTasksDb());
}
const full = (ids) => ids.map((id) => {
  const { title, dueDate } = tasks.find((t) => t.id === id);
  return { id, title, dueDate };
});
const refuses = async (repo) => {
  try {
    await repo.list({ status: 'archived' });
    return false;
  } catch {
    return true;
  }
};

test('the file repository lists each status by due date, undated last', async () => {
  const repo = await fileRepo();
  for (const status of ['pending', 'done']) {
    expect((await repo.list({ status })).map((row) => ({ ...row })), `file repo, status ${status}`).toEqual(full(expected[status]));
  }
});

test('the SQLite repository lists each status by due date, undated last', async () => {
  const repo = sqlRepo();
  for (const status of ['pending', 'done']) {
    expect((await repo.list({ status })).map((row) => ({ ...row })), `SQLite repo, status ${status}`).toEqual(full(expected[status]));
  }
});

test('both repositories refuse an unknown status', async () => {
  expect(await refuses(await fileRepo()), 'the file repo throws for status "archived"').toBe(true);
  expect(await refuses(sqlRepo()), 'the SQLite repo throws for status "archived"').toBe(true);
});

test('the note names a storage, a reason and what would change it', () => {
  expect(['file', 'sqlite'], 'choice.storage').toContain(choice?.storage);
  expect(String(choice?.reason ?? '').trim().length, 'length of choice.reason').toBeGreaterThanOrEqual(20);
  expect(String(choice?.wouldChange ?? '').trim().length, 'length of choice.wouldChange').toBeGreaterThanOrEqual(20);
});
