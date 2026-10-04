// Who may do what with a note. One table, used by every note route.
//   owner  (note.ownerId === user.id):        read, update, delete, share
//   reader (note.readers includes user.id):   read
//   admin  (user.role === 'admin'):           read, delete — moderation, not editing
//   anyone else, and any other action:        nothing

// true when `user` may do `action` ('read' | 'update' | 'delete' | 'share') with `note`.
export function can(user, action, note) {
  // TODO
  return true;
}
