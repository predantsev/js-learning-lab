// record[field] when the record has its OWN field with that name
// (even if it holds null or undefined); otherwise the fallback.
function getField(record, field, fallback) {
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
