// Starts counting at 1, so the first task is never looked at.
function countPending(tasks) {
  let count = 0;
  for (let i = 1; i < tasks.length; i++) {
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
