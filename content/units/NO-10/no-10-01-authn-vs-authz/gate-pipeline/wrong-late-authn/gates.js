// Two gates for every task route.
import { HttpError } from './http-helpers.js';
import { labCredentials, users } from './lab-data.js';

// Authentication: return the user named by the "Authorization: Bearer <token>" header,
// or throw new HttpError(401, 'UNAUTHENTICATED').
export function requireUser(request) {
  const match = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '');
  const userId = match ? labCredentials.get(match[1]) : undefined;
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED');
  return user;
}

// Authorization: only the task's owner may 'read' or 'delete' it;
// anyone else gets new HttpError(403, 'FORBIDDEN').
export function requirePermission(user, action, task) {
  const allowed = (action === 'read' || action === 'delete') && task.ownerId === user.id;
  if (!allowed) throw new HttpError(403, 'FORBIDDEN');
}
