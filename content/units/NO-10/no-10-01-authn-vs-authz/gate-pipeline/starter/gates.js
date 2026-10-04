// Two gates for every task route.
import { HttpError } from './http-helpers.js';
import { labCredentials, users } from './lab-data.js';

// Authentication: return the user named by the "Authorization: Bearer <token>" header,
// or throw new HttpError(401, 'UNAUTHENTICATED').
export function requireUser(request) {
  // TODO
  return null;
}

// Authorization: only the task's owner may 'read' or 'delete' it;
// anyone else gets new HttpError(403, 'FORBIDDEN').
export function requirePermission(user, action, task) {
  // TODO
}
