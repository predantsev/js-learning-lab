const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02" },
  { id: "t-03", title: "%%grandma%%", dueDate: null },
];
let loading = false;

// Finds a task after a short wait; rejects with an Error for an unknown id.
function findTask(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const task = tasks.find((item) => item.id === id);
      if (task) {
        resolve(task);
      } else {
        reject(new Error("unknown task " + id));
      }
    }, 50);
  });
}

// The text shown for a task.
function formatLabel(task) {
  return task.title + " — " + (task.dueDate ?? "%%noDate%%");
}

// Returns a promise of the label for `id`: the formatted label of the task,
// or "%%notFound%%" when there is no such task.
// `loading` is true while the task loads and false afterwards, whatever happened.
function loadLabel(id) {
  loading = true;
  // Mistake: nothing handles the rejection for an unknown id.
  return findTask(id)
    .then((task) => formatLabel(task))
    .finally(() => {
      loading = false;
    });
}

// To try it, add for example:
// loadLabel("t-01").then((label) => console.log(label));
