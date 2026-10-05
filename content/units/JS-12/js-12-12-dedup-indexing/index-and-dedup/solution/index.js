// A Map from id to record. If an id repeats, the first record with it wins.
function indexById(records) {
  const index = new Map();
  for (const record of records) {
    if (!index.has(record.id)) {
      index.set(record.id, record);
    }
  }
  return index;
}

// A new array without repeats: two records are repeats when keyFn gives them
// the same key. The first record with each key is kept, in the original order.
function dedupBy(records, keyFn) {
  const seen = new Set();
  const kept = [];
  for (const record of records) {
    const key = keyFn(record);
    if (!seen.has(key)) {
      seen.add(key);
      kept.push(record);
    }
  }
  return kept;
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
