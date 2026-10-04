// Who may do what with a note — written as plain conditions, deny by default.
export function can(user, action, note) {
  if (note.ownerId === user.id && ['read', 'update', 'delete', 'share'].includes(action)) return true;
  if (action === 'read' && (note.readers.includes(user.id) || user.role === 'admin')) return true;
  if (action === 'delete' && user.role === 'admin') return true;
  return false;
}
