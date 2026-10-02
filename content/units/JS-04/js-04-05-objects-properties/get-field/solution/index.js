// The value of the record's OWN field named by `field`
// (even if it holds null or undefined); otherwise the fallback.
function getField(record, field, fallback) {
  if (Object.hasOwn(record, field)) {
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
