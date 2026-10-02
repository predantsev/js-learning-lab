// <= n makes one iteration too many: firstN(list, 2) returns three habits.
function firstN(list, n) {
  const result = [];
  for (let i = 0; i <= n && i < list.length; i++) {
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
