// Verifies a restored copy of the planner data against the source.
import { readTasks } from './store.js';
import { summary } from './service.js';

export async function verifyRestore(sourceDir, restoredDir, day) {
  const problems = [];
  let restored;
  try {
    restored = await readTasks(restoredDir);
  } catch (error) {
    return { ok: false, problems: [`the restored data cannot be read: ${error.message}`] };
  }
  const sourceIds = new Set((await readTasks(sourceDir)).map((task) => task.id));
  const restoredIds = new Set(restored.map((task) => task.id));
  const missing = [...sourceIds].filter((id) => !restoredIds.has(id));
  const extra = [...restoredIds].filter((id) => !sourceIds.has(id));
  if (missing.length > 0) problems.push(`missing ids: ${missing.join(', ')}`);

  const expected = await summary(sourceDir, day);
  const actual = await summary(restoredDir, day);
  if (expected.pending !== actual.pending || expected.dueBy !== actual.dueBy) {
    problems.push(`summary differs: source ${JSON.stringify(expected)}, restored ${JSON.stringify(actual)}`);
  }
  return { ok: problems.length === 0, problems };
}
