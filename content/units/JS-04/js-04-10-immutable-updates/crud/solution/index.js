// Each function returns a NEW array and never changes
// the input list or its records.

// A new list with the record added at the end.
function addRecord(list, record) {
  return [...list, record];
}

// A new list where the record with this id is replaced
// by a copy with the changes merged in.
// Records with other ids are reused as they are.
function updateRecord(list, id, changes) {
  const result = [];
  for (const record of list) {
    if (record.id === id) {
      result.push({ ...record, ...changes });
    } else {
      result.push(record);
    }
  }
  return result;
}

// A new list without the record with this id.
function removeRecord(list, id) {
  const result = [];
  for (const record of list) {
    if (record.id !== id) {
      result.push(record);
    }
  }
  return result;
}

const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%books%%", done: false },
];
const added = addRecord(tasks, {
  id: "t-03",
  title: "%%grandma%%",
  done: false,
});
console.log(added);
console.log(updateRecord(tasks, "t-02", { done: true }));
console.log(removeRecord(tasks, "t-01"));
console.log(tasks);
