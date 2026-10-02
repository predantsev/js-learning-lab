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
  return records.reduce((counts, record) => {
    if (counts.has(record.category)) {
      counts.set(record.category, counts.get(record.category) + 1);
    } else {
      counts.set(record.category, 1);
    }
    return counts;
  }, new Map());
}

// Returns the counts as JSON text, for example '{"food":2}'.
function categoryCountsJson(records) {
  const plain = {};
  for (const [category, count] of countByCategory(records)) {
    plain[category] = count;
  }
  return JSON.stringify(plain);
}

console.log(countByCategory(expenses));
console.log(categoryCountsJson(expenses));
