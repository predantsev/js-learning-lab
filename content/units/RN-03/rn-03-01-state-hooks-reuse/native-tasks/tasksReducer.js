// tasksReducer.js: shared with the web client. No DOM, no storage, no platform code.
export function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'toggle':
      return tasks.map((task) => (task.id === action.id ? { ...task, done: !task.done } : task));
    case 'remove':
      return tasks.filter((task) => task.id !== action.id);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
