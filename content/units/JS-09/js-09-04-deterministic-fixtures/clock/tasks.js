// A task is overdue when it is not done, has a due date, and that date is before today.
export function isOverdue(task) {
  const today = new Date().toISOString().slice(0, 10); // today's date as "YYYY-MM-DD" (in UTC)
  return !task.done && task.dueDate !== null && task.dueDate < today;
}
