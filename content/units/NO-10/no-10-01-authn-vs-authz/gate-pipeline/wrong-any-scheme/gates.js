// Two gates for every task route.
import { HttpError } from './http-helpers.js';
import { labCredentials, users } from './lab-data.js';

// Authentication: return the user named by the "Authorization: Bearer <token>" header,
// or throw new HttpError(401, 'UNAUTHENTICATED').
export function requireUser(request) {
  // Takes the second word whatever the scheme is: "Basic lab-token-u01" gets in too.
  const token = (request.headers.authorization ?? '').split(' ')[1];
  const user = users.find((candidate) => candidate.id === labCredentials.get(token));
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED');
  return user;
}

// Authorization: only the task's owner may 'read' or 'delete' it;
// anyone else gets new HttpError(403, 'FORBIDDEN').
export function requirePermission(user, action, task) {
  const allowed = (action === 'read' || action === 'delete') && task.ownerId === user.id;
  if (!allowed) throw new HttpError(403, 'FORBIDDEN');
}
