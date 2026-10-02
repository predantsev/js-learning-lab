const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%books%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-06", title: "%%wardrobe%%", done: true },
];

// Another valid approach: an explicit check instead of ??, and the query lowercased once.
function byStatus(list, done) {
  return list.filter((task) => task.done === done);
}

function findById(list, id) {
  const found = list.find((task) => task.id === id);
  if (found === undefined) {
    return null;
  }
  return found;
}

function searchByTitle(list, query) {
  const needle = query.toLowerCase();
  return list.filter((task) => task.title.toLowerCase().includes(needle));
}

console.log(byStatus(tasks, false));
console.log(findById(tasks, "t-04"));
console.log(findById(tasks, "t-99"));
console.log(searchByTitle(tasks, "%%queryUpper%%"));
