const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-02", title: "%%books%%", dueDate: "2026-03-01", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
  { id: "t-04", title: "%%internet%%", dueDate: "2026-02-27", done: true },
  { id: "t-05", title: "%%dentist%%", dueDate: "2026-03-10", done: false },
];

const isPending = (task) => !task.done;

const matchesQuery = (task, query) => task.title.toLowerCase().includes(query.toLowerCase());

const byDueDate = (a, b) => {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate.localeCompare(b.dueDate);
};

const toLabel = (task) => task.title + " · " + (task.dueDate ?? "%%noDate%%");

// map comes first: every later step receives labels instead of tasks,
// and matchesQuery crashes reading task.title of a label.
function pendingLabels(list, query) {
  return list
    .map(toLabel)
    .filter(isPending)
    .filter((task) => matchesQuery(task, query))
    .toSorted(byDueDate);
}

console.log(pendingLabels(tasks, ""));
