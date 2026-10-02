// Deep-copies the whole list "just in case": safe, but no untouched record is reused any more.
function addRecord(list, record) {
  return [...list, record];
}

function updateRecord(list, id, changes) {
  const result = structuredClone(list);
  for (const record of result) {
    if (record.id === id) {
      for (const key of Object.keys(changes)) {
        record[key] = changes[key];
      }
    }
  }
  return result;
}

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
