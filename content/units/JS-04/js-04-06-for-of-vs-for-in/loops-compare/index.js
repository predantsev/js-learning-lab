// A task created from shared defaults:
// it inherits priority and done from defaults.
const defaults = { priority: "normal", done: false };
const task = Object.create(defaults);
task.id = "t-05";
task.title = "%%dentist%%";
task.dueDate = "2026-03-10";

console.log("for…in:");
for (const key in task) {
  console.log(" ", key, "=", task[key]);
}

console.log("Object.keys:", Object.keys(task));
console.log("task.priority:", task.priority);
