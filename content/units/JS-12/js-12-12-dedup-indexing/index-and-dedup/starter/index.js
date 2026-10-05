// A Map from id to record. If an id repeats, the first record with it wins.
function indexById(records) {
  // Write the body of the function here.
}

// A new array without repeats: two records are repeats when keyFn gives them
// the same key. The first record with each key is kept, in the original order.
function dedupBy(records, keyFn) {
  return [...new Set(records)];
}

const habits = [
  { id: "h-01", name: "%%water%%" },
  { id: "h-02", name: "%%read%%" },
  { id: "h-01", name: "%%water%%" },
  { id: "h-07", name: "%%waterShout%%" },
];
console.log(dedupBy(habits, (habit) => habit.id).length);
console.log(dedupBy(habits, (habit) => habit.name.trim().toLowerCase()).length);
console.log(indexById(habits));
