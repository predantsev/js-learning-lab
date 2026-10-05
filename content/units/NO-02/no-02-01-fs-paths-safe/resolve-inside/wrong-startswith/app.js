// Misconception: "the path starts with the folder's path, so it is inside" (no separator).
import path from 'node:path';

export function resolveInside(baseDir, name) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  if (!target.startsWith(base)) throw new Error(`"${name}" is outside the data folder`);
  return target;
}
