// in also sees inherited names, so getField(task, "toString", ...) returns a function.
function getField(record, field, fallback) {
  if (field in record) {
    return record[field];
  }
  return fallback;
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
