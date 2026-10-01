// record.field reads a property literally called "field", not the one named by the parameter.
function getField(record, field, fallback) {
  if (Object.hasOwn(record, field)) {
    return record.field;
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
