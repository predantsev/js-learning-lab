// overdue.js: the overdue rule of the planner.

// overdueOn(list, day) → the overdue tasks of the list on that day.
export function overdueOn(list, day) {
  return list
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0)).filter((task) => !task.done && task.dueDate !== null && task.dueDate < day);
}
