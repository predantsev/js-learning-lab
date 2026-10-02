const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-02", title: "%%books%%", dueDate: "2026-03-01", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
  { id: "t-04", title: "%%internet%%", dueDate: "2026-02-27", done: true },
  { id: "t-05", title: "%%dentist%%", dueDate: "2026-03-10", done: false },
];

const isPending = (task) => !task.done;

// Only the title is lowercased, so a query typed in capitals never matches.
const matchesQuery = (task, query) => task.title.toLowerCase().includes(query);

const byDueDate = (a, b) => {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate.localeCompare(b.dueDate);
};

const toLabel = (task) => task.title + " · " + (task.dueDate ?? "%%noDate%%");

function pendingLabels(list, query) {
  return list
    .filter(isPending)
    .filter((task) => matchesQuery(task, query))
    .toSorted(byDueDate)
    .map(toLabel);
}

console.log(pendingLabels(tasks, ""));
