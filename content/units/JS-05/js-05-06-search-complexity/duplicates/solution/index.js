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
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      comparisons = comparisons + 1;
      if (list[i].id === list[j].id) {
        return true;
      }
    }
  }
  return false;
}

// 2. One pass with a lookup object of the ids seen so far (check it with Object.hasOwn).
function hasDuplicateIdsLookup(list) {
  const seen = {};
  for (const habit of list) {
    comparisons = comparisons + 1;
    if (Object.hasOwn(seen, habit.id)) {
      return true;
    }
    seen[habit.id] = true;
  }
  return false;
}

comparisons = 0;
console.log(hasDuplicateIdsNested(habits), comparisons);
comparisons = 0;
console.log(hasDuplicateIdsLookup(habits), comparisons);
