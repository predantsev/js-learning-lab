// A short piece of the planner's domain module, as it was exported.

// How many unfinished tasks are due on the given day or earlier.
export function countDueTasks(list, day) {
  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;
}
