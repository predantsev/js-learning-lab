// A Map from id to record. If an id repeats, the first record with it wins.
// Built once and reused: building it again looks like wasted work.
let cachedIndex = null;

function indexById(records) {
  if (cachedIndex === null) {
    cachedIndex = new Map();
    for (const record of records) {
      if (!cachedIndex.has(record.id)) {
        cachedIndex.set(record.id, record);
      }
    }
  }
  return cachedIndex;
}

// A new array without repeats: two records are repeats when keyFn gives them
// the same key. The first record with each key is kept, in the original order.
function dedupBy(records, keyFn) {
  const seen = new Set();
  return records.filter((record) => {
    const key = keyFn(record);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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
