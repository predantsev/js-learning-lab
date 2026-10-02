const ids = ["t-01", "t-02"];
for (const value of ids) {
  console.log("of:", value);
}
for (const key in ids) {
  console.log("in:", key, typeof key);
}

const defaults = { done: false };
const task = Object.create(defaults);
task.id = "t-03";
task.priority = "low";
for (const key in task) {
  console.log("in task:", key);
}
for (const key of Object.keys(task)) {
  console.log("own:", key);
}
