// A while loop works just as well: the start and the step are written by hand.
function countPending(tasks) {
  let count = 0;
  let i = 0;
  while (i < tasks.length) {
    if (!tasks[i].done) {
      count = count + 1;
    }
    i++;
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
