// tasksReducer.js: shared with the web client. Do not edit.
export function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'rename':
      return tasks.map((task) => (task.id === action.id ? { ...task, title: action.title } : task));
    case 'remove':
      return tasks.filter((task) => task.id !== action.id);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
