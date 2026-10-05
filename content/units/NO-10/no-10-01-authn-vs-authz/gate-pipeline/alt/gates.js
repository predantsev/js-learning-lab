// Two gates for every task route.
import { HttpError } from './http-helpers.js';
import { labCredentials, users } from './lab-data.js';

const OWNER_ACTIONS = new Set(['read', 'delete']);

export function requireUser(request) {
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token || !labCredentials.has(token)) {
    throw new HttpError(401, 'UNAUTHENTICATED');
  }
  return users.find((user) => user.id === labCredentials.get(token));
}

export function requirePermission(user, action, task) {
  if (task.ownerId !== user.id || !OWNER_ACTIONS.has(action)) {
    throw new HttpError(403, 'FORBIDDEN');
  }
}
