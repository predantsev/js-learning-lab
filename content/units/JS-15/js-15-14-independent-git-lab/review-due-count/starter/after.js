// dueCount on the pull request's branch (read-only).
// Pull request: "Count due tasks in one loop instead of filter".
export function dueCount(tasks, today) {
  let count = 0;
  for (const task of tasks) {
    if (!task.done && task.dueDate < today) count++;
  }
  return count;
}
