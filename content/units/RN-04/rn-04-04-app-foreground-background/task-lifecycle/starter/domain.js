// Read-only: the planner's shared domain function. `today` is always passed in.
export function countDueTasks(tasks, today) {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}
