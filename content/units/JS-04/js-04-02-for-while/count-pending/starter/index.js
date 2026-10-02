// Count the tasks whose done field is false.
function countPending(tasks) {
  let count = 0;
  // walk through tasks with a for loop here
  return count;
}

const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-03", title: "%%grandma%%", done: false },
];
console.log(countPending(tasks));
console.log(countPending([]));
