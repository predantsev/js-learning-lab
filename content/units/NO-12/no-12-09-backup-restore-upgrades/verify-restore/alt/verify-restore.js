// Verifies a restored copy of the planner data against the source.
// This version compares the sorted id lists and one JSON text of the summary.
import { readTasks } from './store.js';
import { summary } from './service.js';

const sortedIds = (tasks) => tasks.map((t) => t.id).toSorted();

export async function verifyRestore(sourceDir, restoredDir, day) {
  const restored = await readTasks(restoredDir).catch(() => null);
  if (restored === null) return { ok: false, problems: ['restored data is unreadable'] };
  const problems = [];
  const a = sortedIds(await readTasks(sourceDir));
  const b = sortedIds(restored);
  if (a.join('\n') !== b.join('\n')) {
    problems.push(`ids differ: only in source [${a.filter((id) => !b.includes(id))}], only in restore [${b.filter((id) => !a.includes(id))}]`);
  }
  const [s1, s2] = await Promise.all([summary(sourceDir, day), summary(restoredDir, day)]);
  if (JSON.stringify(s1) !== JSON.stringify(s2)) problems.push('the summary differs');
  return { ok: !problems.length, problems };
}
