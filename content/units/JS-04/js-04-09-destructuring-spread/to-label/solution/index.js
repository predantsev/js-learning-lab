// Destructure the task right in the parameter list;
// priority defaults to "normal".
// Return "title · priority".
function toLabel({ title, priority = "normal" }) {
  return title + " · " + priority;
}

// A NEW object with every field of the record except id
// (use a rest pattern).
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
