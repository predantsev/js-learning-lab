// Misconception: "any name with a .. segment is an attack", so a harmless detour is refused too.
import path from 'node:path';

export function resolveInside(baseDir, name) {
  if (name.split(/[\\/]/).includes('..')) throw new Error(`"${name}" contains ..`);
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  if (!target.startsWith(base + path.sep)) throw new Error(`"${name}" is outside the data folder`);
  return target;
}
