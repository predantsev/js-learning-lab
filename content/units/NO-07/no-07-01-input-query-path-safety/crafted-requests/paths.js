// A client error that the central handler answers with 400.
import path from 'node:path';

export class BadRequestError extends Error {
  constructor(details) {
    super('bad request');
    this.name = 'BadRequestError';
    this.details = details; // for example { name: 'outsideFolder' }
  }
}

// resolveInside(baseDir, name): the absolute path of `name` inside `baseDir` (unit NO-02),
// or a BadRequestError when the resolved path leaves that folder.
export function resolveInside(baseDir, name) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  const relative = path.relative(base, target);
  const outside = relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  if (outside) throw new BadRequestError({ name: 'outsideFolder' });
  return target;
}
