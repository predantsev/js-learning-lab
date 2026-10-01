const tasks = [
  { id: "t-01", title: "%%water%%" },
  { id: "t-02", title: "%%books%%" },
  { id: "t-03", title: "%%grandma%%" },
  { id: "t-02", title: "%%booksAgain%%" },
];

// 1. An object that maps every id to its record.
//    If an id occurs more than once, keep the FIRST record with that id.
function indexById(records) {
  const index = {};
  for (const record of records) {
    if (!Object.hasOwn(index, record.id)) {
      index[record.id] = record;
    }
  }
  return index;
}

// 2. For every id in ids: the record with that id, or null when there is none.
//    Build the lookup once; do not search the whole list for every id.
function pickByIds(records, ids) {
  const index = indexById(records);
  return ids.map((id) => (Object.hasOwn(index, id) ? index[id] : null));
}

console.log(indexById(tasks));
console.log(pickByIds(tasks, ["t-03", "t-99", "t-02"]));
