// Also valid: walk the whole list and leave the loop with break once n habits are collected.
function firstN(list, n) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    if (result.length >= n) {
      break;
    }
    result.push(list[i]);
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
