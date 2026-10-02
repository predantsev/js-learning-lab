// push changes the caller's list, and the same array comes back.
function addRecord(list, record) {
  list.push(record);
  return list;
}

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
