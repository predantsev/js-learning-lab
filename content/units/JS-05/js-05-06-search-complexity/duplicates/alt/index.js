const habits = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-02", name: "%%read%%" },
  { id: "h-03", name: "%%water%%" },
  { id: "h-04", name: "%%tidy%%" },
  { id: "h-06", name: "%%walk%%" },
  { id: "h-02", name: "%%read%%" },
];

let comparisons = 0;

// Another valid approach: compare each record with the earlier ones,
// and mark seen ids with true, checking for exactly true.
function hasDuplicateIdsNested(list) {
  for (let i = 1; i < list.length; i++) {
    for (let j = 0; j < i; j++) {
      comparisons = comparisons + 1;
      if (list[i].id === list[j].id) {
        return true;
      }
    }
  }
  return false;
}

function hasDuplicateIdsLookup(list) {
  const seen = {};
  for (const habit of list) {
    comparisons = comparisons + 1;
    if (seen[habit.id] === true) {
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
