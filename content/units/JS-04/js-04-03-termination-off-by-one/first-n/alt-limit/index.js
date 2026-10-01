// Also valid: work out the limit first, then loop up to it.
function firstN(list, n) {
  let limit = n;
  if (limit > list.length) {
    limit = list.length;
  }
  const result = [];
  for (let i = 0; i < limit; i++) {
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
