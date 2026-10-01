// A planner task: dueDate is deliberately empty (null),
// and there is no done field at all.
const task = {
  id: "t-03",
  title: "%%grandma%%",
  dueDate: null,
  priority: "low",
};

console.log("task.priority:", task.priority);
const field = "dueDate";
console.log("task[field]:", task[field]);
console.log("task.done:", task.done);

console.log('"dueDate" in task:', "dueDate" in task);
console.log('"done" in task:', "done" in task);
console.log('"toString" in task:', "toString" in task);
console.log('hasOwn "toString":', Object.hasOwn(task, "toString"));

task.done = false;      // add a field
task.priority = "high"; // change a field
delete task.dueDate;    // remove a field
console.log(task);
