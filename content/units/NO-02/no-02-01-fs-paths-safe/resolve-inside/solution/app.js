// resolveInside(baseDir, name): the absolute path of `name` inside `baseDir`,
// or an Error when the name would lead anywhere outside that folder.
import path from 'node:path';

export function resolveInside(baseDir, name) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  // How to get from the folder to the target: "a.json" stays inside, "../x" climbs out,
  // and on Windows a target on another drive comes back as an absolute path.
  const relative = path.relative(base, target);
  const outside = relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  if (outside) throw new Error(`"${name}" is outside the data folder`);
  return target;
}
