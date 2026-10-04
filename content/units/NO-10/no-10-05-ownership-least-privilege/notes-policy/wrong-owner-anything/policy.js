// Who may do what with a note. One table, used by every note route.
//   owner  (note.ownerId === user.id):        read, update, delete, share
//   reader (note.readers includes user.id):   read
//   admin  (user.role === 'admin'):           read, delete — moderation, not editing
//   anyone else, and any other action:        nothing

const ALLOWED = {
  owner: ['read', 'update', 'delete', 'share'],
  reader: ['read'],
  admin: ['read', 'delete'],
};

// Every role this user has for this note (a user may have more than one).
function rolesFor(user, note) {
  const roles = [];
  if (note.ownerId === user.id) roles.push('owner');
  if (note.readers.includes(user.id)) roles.push('reader');
  if (user.role === 'admin') roles.push('admin');
  return roles;
}

// true when `user` may do `action` ('read' | 'update' | 'delete' | 'share') with `note`.
export function can(user, action, note) {
  if (note.ownerId === user.id) return true; // it is theirs, after all
  return rolesFor(user, note).some((role) => ALLOWED[role].includes(action));
}
