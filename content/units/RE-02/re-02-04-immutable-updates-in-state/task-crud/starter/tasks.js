// The starting tasks of the planner. Read-only.
export const tasks = [
  { id: "t-01", title: "%%waterPlants%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-02", title: "%%libraryBooks%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false, priority: "low" },
];

let nextNumber = 4;

// A new pending task with a fresh id ("t-04", "t-05", …).
export function createTask(title) {
  const id = "t-" + String(nextNumber).padStart(2, "0");
  nextNumber += 1;
  return { id, title, dueDate: null, done: false, priority: "normal" };
}
