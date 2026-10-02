const expenses = [
  { id: "e-01", amountMinor: 84550, category: "food" },
  { id: "e-02", amountMinor: 52000, category: "transport" },
  { id: "e-03", amountMinor: 18000, category: "fun" },
  { id: "e-04", amountMinor: 9990, category: "home" },
  { id: "e-05", amountMinor: 30000, category: "fun" },
  { id: "e-06", amountMinor: 21050, category: "food" },
];

// Returns a Map: category → how many records have it, in the order categories first appear.
function countByCategory(records) {
  const counts = new Map();
  for (const record of records) {
    counts.set(record.category, (counts.get(record.category) ?? 0) + 1);
  }
  return counts;
}

// Returns the counts as JSON text, for example '{"food":2}'.
function categoryCountsJson(records) {
  return JSON.stringify(countByCategory(records));
}

console.log(countByCategory(expenses));
console.log(categoryCountsJson(expenses));
