// Also valid: a while loop that stops when the list ends or n habits are collected.
function firstN(list, n) {
  const result = [];
  let i = 0;
  while (i < list.length && result.length < n) {
    result.push(list[i]);
    i++;
  }
  return result;
}

const habits = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-02", name: "%%reading%%" },
  { id: "h-03", name: "%%water%%" },
];
console.log(firstN(habits, 2));
console.log(firstN(habits, 5));
console.log(firstN([], 3));
