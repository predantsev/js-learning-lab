const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%books%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-06", title: "%%wardrobe%%", done: true },
];

// 1. Every task whose done field equals the given value (true or false).
function byStatus(list, done) {
  // your code here
}

// 2. The task with this id, or null when there is no such task.
function findById(list, id) {
  // your code here
}

// 3. Every task whose title contains the query, ignoring upper and lower case.
function searchByTitle(list, query) {
  // your code here
}

console.log(byStatus(tasks, false));
console.log(findById(tasks, "t-04"));
console.log(findById(tasks, "t-99"));
console.log(searchByTitle(tasks, "%%queryUpper%%"));
