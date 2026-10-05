// The task routes. Each returns { status, body? } or throws an HttpError.
import { HttpError } from './http-helpers.js';
import { requirePermission, requireUser } from './gates.js';

// One shared pipeline: identity, then the record, then the permission.
function loadAllowed(request, id, repo, action) {
  const user = requireUser(request);
  const task = repo.findTask(id);
  if (!task) throw new HttpError(404, 'NOT_FOUND');
  requirePermission(user, action, task);
  return task;
}

export function readTask(request, id, repo) {
  return { status: 200, body: loadAllowed(request, id, repo, 'read') };
}

export function deleteTask(request, id, repo) {
  loadAllowed(request, id, repo, 'delete');
  repo.deleteTask(id);
  return { status: 204 };
}
