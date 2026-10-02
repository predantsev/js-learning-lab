// Also valid: destructure inside the body, and delete id from a copy (not from the original).
function toLabel(task) {
  const { title, priority = "normal" } = task;
  return title + " · " + priority;
}

function withoutId(record) {
  const copy = { ...record };
  delete copy.id;
  return copy;
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
