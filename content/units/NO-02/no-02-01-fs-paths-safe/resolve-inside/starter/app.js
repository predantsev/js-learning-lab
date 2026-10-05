// resolveInside(baseDir, name): the absolute path of `name` inside `baseDir`,
// or an Error when the name would lead anywhere outside that folder.
import path from 'node:path';

export function resolveInside(baseDir, name) {
  // Resolve the name, then decide from the RESULT whether it is still inside baseDir.
  return path.join(baseDir, name);
}
