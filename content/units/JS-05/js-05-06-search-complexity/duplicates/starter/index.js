const habits = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-02", name: "%%read%%" },
  { id: "h-03", name: "%%water%%" },
  { id: "h-04", name: "%%tidy%%" },
  { id: "h-06", name: "%%walk%%" },
  { id: "h-02", name: "%%read%%" },
];

let comparisons = 0;

// 1. Compare every pair of records with two nested loops.
function hasDuplicateIdsNested(list) {
  // your code here
}

// 2. One pass with a lookup object of the ids seen so far (check it with Object.hasOwn).
function hasDuplicateIdsLookup(list) {
  // your code here
}

comparisons = 0;
console.log(hasDuplicateIdsNested(habits), comparisons);
comparisons = 0;
console.log(hasDuplicateIdsLookup(habits), comparisons);
