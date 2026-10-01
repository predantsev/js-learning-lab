const tasks = [
  { id: "t-01", title: "%%water%%" },
  { id: "t-02", title: "%%books%%" },
  { id: "t-03", title: "%%grandma%%" },
  { id: "t-02", title: "%%booksAgain%%" },
];

function indexById(records) {
  const index = {};
  for (const record of records) {
    if (!Object.hasOwn(index, record.id)) {
      index[record.id] = record;
    }
  }
  return index;
}

// index["toString"] finds the inherited method, so ?? null never kicks in for it.
function pickByIds(records, ids) {
  const index = indexById(records);
  return ids.map((id) => index[id] ?? null);
}

console.log(indexById(tasks));
console.log(pickByIds(tasks, ["t-03", "t-99", "t-02"]));
