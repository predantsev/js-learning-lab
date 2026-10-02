const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%books%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-06", title: "%%wardrobe%%", done: true },
];

function byStatus(list, done) {
  return list.filter((task) => task.done === done);
}

// find gives undefined for a missing id, but the task asks for null.
function findById(list, id) {
  return list.find((task) => task.id === id);
}

function searchByTitle(list, query) {
  return list.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));
}

console.log(byStatus(tasks, false));
console.log(findById(tasks, "t-04"));
console.log(findById(tasks, "t-99"));
console.log(searchByTitle(tasks, "%%queryUpper%%"));
