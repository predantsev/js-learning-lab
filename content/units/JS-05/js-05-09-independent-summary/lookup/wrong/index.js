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

// Correct answers, but a new linear search for every id: ids × records work.
function pickByIds(records, ids) {
  return ids.map((id) => records.find((record) => record.id === id) ?? null);
}

console.log(indexById(tasks));
console.log(pickByIds(tasks, ["t-03", "t-99", "t-02"]));
