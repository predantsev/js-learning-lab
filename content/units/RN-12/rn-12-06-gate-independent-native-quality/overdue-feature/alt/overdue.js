// overdue.js: the overdue rule of the planner.

// overdueOn(list, day) → the overdue tasks of the list on that day.
export function overdueOn(list, day) {
  const result = [];
  for (const task of list) {
    if (task.done || task.dueDate === null) continue;
    if (task.dueDate < day) result.push(task);
  }
  return result.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate, 'en'));
}
