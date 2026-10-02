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

// filter calls matchesQuery(task, index, list): the second argument is the index, not the query,
// so query.toLowerCase is not a function.
function pendingLabels(list, query) {
  return list
    .filter(isPending)
    .filter(matchesQuery)
    .toSorted(byDueDate)
    .map(toLabel);
}

console.log(pendingLabels(tasks, ""));
