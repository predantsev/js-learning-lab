// No default in the destructuring: a task without priority gets the label "… · undefined".
function toLabel({ title, priority }) {
  return title + " · " + priority;
}

function withoutId(record) {
  const { id, ...rest } = record;
  return rest;
}

const task = {
  id: "t-02",
  title: "%%books%%",
  dueDate: "2026-03-01",
  done: false,
  priority: "high",
};
console.log(toLabel(task));
console.log(toLabel({ title: "%%grandma%%" }));
console.log(withoutId(task));
