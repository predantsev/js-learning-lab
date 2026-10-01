// A planner task taken apart and put together again.
const task = {
  id: "t-02",
  title: "%%books%%",
  dueDate: "2026-03-01",
  done: false,
  priority: "high",
};

const { title, note = "—" } = task;
console.log(title, "|", note);

const { dueDate, ...withoutDate } = task;
console.log(dueDate, withoutDate);

const changes = { done: true, priority: "normal" };
const updated = { ...task, ...changes };
console.log("updated:", updated.done, updated.priority);
console.log("task:", task.done, task.priority);
