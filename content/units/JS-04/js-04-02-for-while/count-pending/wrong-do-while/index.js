// do-while runs its body before the first check: for [] it reads tasks[0].done of undefined.
function countPending(tasks) {
  let count = 0;
  let i = 0;
  do {
    if (tasks[i].done === false) {
      count++;
    }
    i++;
  } while (i < tasks.length);
  return count;
}

const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-03", title: "%%grandma%%", done: false },
];
console.log(countPending(tasks));
console.log(countPending([]));
