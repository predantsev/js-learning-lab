// delete on the record itself: the caller's task loses its id.
function toLabel({ title, priority = "normal" }) {
  return title + " · " + priority;
}

function withoutId(record) {
  delete record.id;
  return record;
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
