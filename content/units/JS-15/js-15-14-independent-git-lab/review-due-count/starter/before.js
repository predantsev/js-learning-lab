// dueCount on main, before the pull request (read-only).
// Counts pending tasks whose due date is on or before today.
export function dueCount(tasks, today) {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}
