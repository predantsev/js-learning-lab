const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-02", title: "%%books%%", dueDate: "2026-03-01", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
  { id: "t-04", title: "%%internet%%", dueDate: "2026-02-27", done: true },
  { id: "t-05", title: "%%dentist%%", dueDate: "2026-03-10", done: false },
];

// The old version: one long loop does everything.
function pendingLabelsLoop(list, query) {
  const found = [];
  for (const task of list) {
    const title = task.title.toLowerCase();
    if (!task.done && title.includes(query.toLowerCase())) {
      found.push(task);
    }
  }
  found.sort((a, b) => {
    if (a.dueDate === b.dueDate) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  const labels = [];
  for (const task of found) {
    labels.push(task.title + " · " + (task.dueDate ?? "%%noDate%%"));
  }
  return labels;
}

// The new version: small named steps joined in a chain.
const isPending = (task) => !task.done;

const matchesQuery = (task, query) => task.title.toLowerCase().includes(query.toLowerCase());

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

console.log(pendingLabelsLoop(tasks, ""));
console.log(pendingLabels(tasks, ""));
