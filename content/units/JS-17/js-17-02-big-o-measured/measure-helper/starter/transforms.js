// Two ways to count planner tasks per due date. Each builds n synthetic tasks over 30 dates
// and returns how many operations it made. Read-only: measure() calls them.
function makeTasks(n) {
  const tasks = [];
  for (let i = 0; i < n; i++) {
    const day = String(1 + (i % 30)).padStart(2, "0");
    tasks.push({ id: "t-" + i, dueDate: "2026-04-" + day });
  }
  return tasks;
}

// For every distinct date, scan the whole list again.
export function countPerDateByScan(n) {
  const tasks = makeTasks(n);
  const dates = [...new Set(tasks.map((task) => task.dueDate))];
  let operations = 0;
  const counts = {};
  for (const date of dates) {
    counts[date] = 0;
    for (const task of tasks) {
      operations = operations + 1;
      if (task.dueDate === date) counts[date] = counts[date] + 1;
    }
  }
  return operations;
}

// One pass with a Map from date to count.
export function countPerDateWithMap(n) {
  const tasks = makeTasks(n);
  let operations = 0;
  const counts = new Map();
  for (const task of tasks) {
    operations = operations + 1;
    counts.set(task.dueDate, (counts.get(task.dueDate) ?? 0) + 1);
  }
  return operations;
}
