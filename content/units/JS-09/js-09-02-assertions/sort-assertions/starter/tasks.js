const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };

// Earliest date first; tasks without a date go last.
function compareByDue(a, b) {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

// Returns a NEW array of the tasks sorted by "dueDate" or by "priority" (high, normal, low).
// The array it receives stays as it was. Any other key throws a RangeError.
export function sortTasks(tasks, key) {
  if (key === "dueDate") return tasks.toSorted(compareByDue);
  if (key === "priority") return tasks.toSorted((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  throw new RangeError(`%%unknownKey%%: ${key}`);
}
