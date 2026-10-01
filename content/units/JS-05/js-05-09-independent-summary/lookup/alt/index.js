const tasks = [
  { id: "t-01", title: "%%water%%" },
  { id: "t-02", title: "%%books%%" },
  { id: "t-03", title: "%%grandma%%" },
  { id: "t-02", title: "%%booksAgain%%" },
];

// Another valid approach: reduce builds the lookup, a loop collects the picks.
function indexById(records) {
  return records.reduce((index, record) => {
    if (!Object.hasOwn(index, record.id)) {
      index[record.id] = record;
    }
    return index;
  }, {});
}

function pickByIds(records, ids) {
  const index = indexById(records);
  const picked = [];
  for (const id of ids) {
    picked.push(Object.hasOwn(index, id) ? index[id] : null);
  }
  return picked;
}

console.log(indexById(tasks));
console.log(pickByIds(tasks, ["t-03", "t-99", "t-02"]));
