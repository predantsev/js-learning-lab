// Verifies a restored copy of the planner data against the source — by file size.
import { stat } from 'node:fs/promises';

export async function verifyRestore(sourceDir, restoredDir) {
  const size = async (dir) => (await stat(`${dir}/tasks.json`).catch(() => ({ size: -1 }))).size;
  const same = (await size(sourceDir)) === (await size(restoredDir));
  return { ok: same, problems: same ? [] : ['the size differs'] };
}
