// Planner domain: pure functions over task records.
export function validateTask(input) {
  const title = String(input.title ?? "").trim();
  if (title.length === 0 || title.length > 80) {
    return { ok: false, errors: { title: "titleLength" } };
  }
  return { ok: true, value: { ...input, title, done: input.done ?? false, priority: input.priority ?? "normal" } };
}

export function countDue(tasks, today) {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}

// Tasks grouped by due date in one pass: a Map from date to the tasks of that date.
export function groupByDueDate(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    const key = task.dueDate ?? "none";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  }
  return groups;
}
