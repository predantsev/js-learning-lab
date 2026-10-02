// Scratch folders of Node runs (<runtimeDir>/node-runs) and type checks (<runtimeDir>/typecheck).
// Each folder name starts with the process id of the server that created it ("<pid>-<id>"). A
// server that crashed or was killed cannot delete its folders, so every server sweeps both roots
// when it starts: it removes folders whose server process is gone (and unprefixed folders left by
// older platform versions), and keeps folders of any server process that is still alive — two
// servers may share one runtime folder (the test suites start several at once).
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomId } from './project-files.mjs';

const OWNER = /^(\d+)-/;

/** A scratch folder name owned by this server process. */
export const scratchName = (prefix) => `${process.pid}-${randomId(prefix)}`;

/** Whether a process with this id exists (EPERM: it exists but belongs to another user). */
export function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/**
 * Remove leftovers in `root`: entries whose owner process no longer exists, and entries without an
 * owner prefix. Returns the removed names. A missing root is not an error.
 */
export async function sweepScratch(root, { isAlive = processAlive } = {}) {
  let entries;
  try {
    entries = await fs.readdir(root);
  } catch {
    return [];
  }
  const removed = [];
  for (const name of entries) {
    const owner = OWNER.exec(name);
    if (owner) {
      const pid = Number(owner[1]);
      if (pid === process.pid || isAlive(pid)) continue;
    }
    try {
      await fs.rm(path.join(root, name), { recursive: true, force: true, maxRetries: 3 });
      removed.push(name);
    } catch {
      /* still in use or not ours to delete: the next start tries again */
    }
  }
  return removed;
}
