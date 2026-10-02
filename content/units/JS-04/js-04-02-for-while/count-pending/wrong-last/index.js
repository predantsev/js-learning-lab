// Stops one step early: the last task is never looked at.
function countPending(tasks) {
  let count = 0;
  for (let i = 0; i < tasks.length - 1; i++) {
    if (tasks[i].done === false) {
      count++;
    }
  }
  return count;
}

const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-03", title: "%%grandma%%", done: false },
];
console.log(countPending(tasks));
console.log(countPending([]));
