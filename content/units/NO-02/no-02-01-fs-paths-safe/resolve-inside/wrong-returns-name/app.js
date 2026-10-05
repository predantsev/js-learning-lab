// Misconception: the check is right, but the caller gets the raw name back, not the resolved path,
// so a later fs call would resolve it again from the working directory.
import path from 'node:path';

export function resolveInside(baseDir, name) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  if (!target.startsWith(base + path.sep)) throw new Error(`"${name}" is outside the data folder`);
  return name;
}
