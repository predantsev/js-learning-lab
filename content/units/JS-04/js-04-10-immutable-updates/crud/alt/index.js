// Also valid: index loops, continue in removeRecord and a copied array in addRecord.
function addRecord(list, record) {
  const result = [...list];
  result.push(record);
  return result;
}

function updateRecord(list, id, changes) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    const record = list[i];
    result.push(record.id === id ? { ...record, ...changes } : record);
  }
  return result;
}

function removeRecord(list, id) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      continue;
    }
    result.push(list[i]);
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
