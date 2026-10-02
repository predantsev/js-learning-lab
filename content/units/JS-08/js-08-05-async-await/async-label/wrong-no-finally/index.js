const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02" },
  { id: "t-03", title: "%%grandma%%", dueDate: null },
];
let loading = false;

// Finds a task after a short wait; rejects with an Error for an unknown id.
// An id that is not text is a programming mistake: it throws at once, without a promise.
function findTask(id) {
  if (typeof id !== "string") {
    throw new TypeError("task id must be text, got " + id);
  }
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

// Rewrite this chain as an async function with await and try/catch/finally.
// Mistake: the flag is cleared only after success.
async function loadLabel(id) {
  loading = true;
  try {
    const task = await findTask(id);
    loading = false;
    return formatLabel(task);
  } catch (error) {
    return "%%notFound%%";
  }
}

// To try it, add for example:
// loadLabel("t-01").then((label) => console.log(label));
