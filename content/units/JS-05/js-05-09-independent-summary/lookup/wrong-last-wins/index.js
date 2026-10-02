const tasks = [
  { id: "t-01", title: "%%water%%" },
  { id: "t-02", title: "%%books%%" },
  { id: "t-03", title: "%%grandma%%" },
  { id: "t-02", title: "%%booksAgain%%" },
];

// Every record overwrites the previous one with the same id: the LAST one wins.
function indexById(records) {
  const index = {};
  for (const record of records) {
    index[record.id] = record;
  }
  return index;
}

function pickByIds(records, ids) {
  const index = indexById(records);
  return ids.map((id) => (Object.hasOwn(index, id) ? index[id] : null));
}

console.log(indexById(tasks));
console.log(pickByIds(tasks, ["t-03", "t-99", "t-02"]));
