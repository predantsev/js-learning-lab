const tasks = [
  { id: "t-01", title: "%%water%%" },
  { id: "t-02", title: "%%books%%" },
  { id: "t-03", title: "%%grandma%%" },
  { id: "t-02", title: "%%booksAgain%%" },
];

// 1. An object that maps every id to its record.
//    If an id occurs more than once, keep the FIRST record with that id.
function indexById(records) {
  // your code here
}

// 2. For every id in ids: the record with that id, or null when there is none.
//    Build the lookup once; do not search the whole list for every id.
function pickByIds(records, ids) {
  // your code here
}

console.log(indexById(tasks));
console.log(pickByIds(tasks, ["t-03", "t-99", "t-02"]));
