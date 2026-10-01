const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%books%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-06", title: "%%wardrobe%%", done: true },
];

// 1. Every task whose done field equals the given value (true or false).
function byStatus(list, done) {
  return list.filter((task) => task.done === done);
}

// 2. The task with this id, or null when there is no such task.
function findById(list, id) {
  return list.find((task) => task.id === id) ?? null;
}

// 3. Every task whose title contains the query, ignoring upper and lower case.
function searchByTitle(list, query) {
  return list.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));
}

console.log(byStatus(tasks, false));
console.log(findById(tasks, "t-04"));
console.log(findById(tasks, "t-99"));
console.log(searchByTitle(tasks, "%%queryUpper%%"));
