// Another valid solution: compare the resolved target with the folder plus a separator.
import path from 'node:path';

export function resolveInside(baseDir, name) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  // The separator matters: "/srv/data-backup" starts with "/srv/data" but not with "/srv/data/".
  if (!target.startsWith(base + path.sep)) {
    throw new Error(`"${name}" is outside the data folder`);
  }
  return target;
}
