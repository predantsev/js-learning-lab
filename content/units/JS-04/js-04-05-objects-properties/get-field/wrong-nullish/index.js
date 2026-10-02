// ?? looks at the value: an own field holding null is replaced, and the inherited toString slips through.
function getField(record, field, fallback) {
  return record[field] ?? fallback;
}

const task = {
  id: "t-03",
  title: "%%grandma%%",
  dueDate: null,
  priority: "low",
};
console.log(getField(task, "priority", "normal"));
console.log(getField(task, "dueDate", "%%noDate%%"));
console.log(getField(task, "done", false));
console.log(getField(task, "toString", "%%none%%"));
