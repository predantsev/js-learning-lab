// Misconception: "removing every '../' from the name is enough to stop path traversal".
import path from 'node:path';

export function resolveInside(baseDir, name) {
  const cleaned = name.replaceAll('../', '');
  return path.join(baseDir, cleaned);
}
