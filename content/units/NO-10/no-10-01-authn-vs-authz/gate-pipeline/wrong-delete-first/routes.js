// The task routes. Each returns { status, body? } or throws an HttpError.
// Call the gates from gates.js so that no request reaches data before they have run.
import { HttpError } from './http-helpers.js';
import { requirePermission, requireUser } from './gates.js';

export function readTask(request, id, repo) {
  const user = requireUser(request); // who is calling? — before any data
  const task = repo.findTask(id);
  if (!task) throw new HttpError(404, 'NOT_FOUND');
  requirePermission(user, 'read', task); // may they? — before the answer
  return { status: 200, body: task };
}

export function deleteTask(request, id, repo) {
  const user = requireUser(request);
  const task = repo.findTask(id);
  if (!task) throw new HttpError(404, 'NOT_FOUND');
  repo.deleteTask(id);
  requirePermission(user, 'delete', task);
  return { status: 204 };
}
