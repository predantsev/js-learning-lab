// Also accepted: the older hasOwnProperty method gives the same answer for ordinary records.
function getField(record, field, fallback) {
  if (record.hasOwnProperty(field)) {
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
