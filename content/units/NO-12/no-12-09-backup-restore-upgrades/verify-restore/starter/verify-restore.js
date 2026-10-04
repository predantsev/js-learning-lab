// Verifies a restored copy of the planner data against the source.
import { readTasks } from './store.js';
import { summary } from './service.js';

export async function verifyRestore(sourceDir, restoredDir, day) {
  // TODO: compare record ids and the summary; never throw
  return { ok: false, problems: [] };
}
