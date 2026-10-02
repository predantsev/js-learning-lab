// Only n limits the loop: for n larger than the list it reads past the end and pushes undefined.
function firstN(list, n) {
  const result = [];
  for (let i = 0; i < n; i++) {
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
