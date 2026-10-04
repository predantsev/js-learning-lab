// Misconception: checking the name itself instead of the resolved result:
// a name that does not start with ".." is trusted, so an absolute name slips through.
import path from 'node:path';

export function resolveInside(baseDir, name) {
  if (path.normalize(name).startsWith('..')) throw new Error(`"${name}" is outside the data folder`);
  return path.resolve(baseDir, name);
}
