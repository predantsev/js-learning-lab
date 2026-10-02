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
const isPending = (task) => {
  // your code here
};

const matchesQuery = (task, query) => {
  // your code here
};

const byDueDate = (a, b) => {
  // your code here
};

const toLabel = (task) => {
  // your code here
};

function pendingLabels(list, query) {
  // your code here: a chain of the steps above
}

console.log(pendingLabelsLoop(tasks, ""));
console.log(pendingLabels(tasks, ""));
