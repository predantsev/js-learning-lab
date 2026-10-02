import { dueMonth, loadTasks, priorityRank, taskLabel } from "./tasks.ts";

const stored = JSON.stringify([
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false, priority: "low" },
  { id: "t-09", title: 42, dueDate: null, done: "no", priority: "urgent" },
]);

for (const task of loadTasks(stored)) {
  console.log(`${taskLabel(task)} | ${dueMonth(task)} | ${priorityRank(task.priority)}`);
}
