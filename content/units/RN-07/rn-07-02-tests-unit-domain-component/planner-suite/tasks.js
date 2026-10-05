// Planner domain code: plain functions, no React Native here.

// Pending tasks due on or before `today` ('YYYY-MM-DD'); a task without a due date is never due.
export function countDueTasks(tasks, today) {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}

const PRIORITIES = ['low', 'normal', 'high'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Checks a task read from storage at run time: stored JSON carries no types.
export function validateTask(input) {
  const raw = typeof input === 'object' && input !== null ? input : {};
  const errors = {};
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (title.length < 1 || title.length > 80) errors.title = 'title.length';
  if (raw.dueDate !== null && !(typeof raw.dueDate === 'string' && DATE.test(raw.dueDate))) errors.dueDate = 'dueDate.format';
  if (typeof raw.done !== 'boolean') errors.done = 'done.boolean';
  if (!PRIORITIES.includes(raw.priority)) errors.priority = 'priority.unknown';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id: raw.id, title, dueDate: raw.dueDate, done: raw.done, priority: raw.priority } };
}
