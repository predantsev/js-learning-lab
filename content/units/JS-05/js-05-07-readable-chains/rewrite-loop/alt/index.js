const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-02", title: "%%books%%", dueDate: "2026-03-01", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
  { id: "t-04", title: "%%internet%%", dueDate: "2026-02-27", done: true },
  { id: "t-05", title: "%%dentist%%", dueDate: "2026-03-10", done: false },
];

// Another valid approach: block bodies with return, one combined filter,
// and sort on the intermediate array (filter already made a new one). The old loop is gone.
const isPending = (task) => {
  return task.done === false;
};

const matchesQuery = (task, query) => {
  const title = task.title.toLowerCase();
  return title.includes(query.toLowerCase());
};

const byDueDate = (a, b) => {
  const aMissing = a.dueDate === null;
  const bMissing = b.dueDate === null;
  if (aMissing || bMissing) {
    return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  }
  return a.dueDate.localeCompare(b.dueDate);
};

const toLabel = (task) => {
  if (task.dueDate === null) {
    return task.title + " · %%noDate%%";
  }
  return task.title + " · " + task.dueDate;
};

function pendingLabels(list, query) {
  const pending = list.filter((task) => isPending(task) && matchesQuery(task, query));
  return pending.sort(byDueDate).map(toLabel);
}

console.log(pendingLabels(tasks, ""));
