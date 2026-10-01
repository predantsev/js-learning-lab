// Another valid approach: a loop for the filter, a spread copy for the sort,
// and a reduce that builds a new summary object on every step.
function searchByText(records, field, query) {
  return records.filter((record) => {
    const text = record[field].toLowerCase();
    return text.includes(query.toLowerCase());
  });
}

function filterByStatus(records, field, value) {
  const result = [];
  for (const record of records) {
    if (record[field] === value) {
      result.push(record);
    }
  }
  return result;
}

function sortBy(records, field) {
  const compare = (a, b) => {
    const aMissing = a[field] === null;
    const bMissing = b[field] === null;
    if (aMissing || bMissing) {
      return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
    }
    return typeof a[field] === "string" ? a[field].localeCompare(b[field]) : a[field] - b[field];
  };
  return [...records].sort(compare);
}

function summarize(records, field) {
  const seen = {};
  return records.reduce(
    (summary, record) => {
      if (Object.hasOwn(seen, record.id)) {
        return summary;
      }
      seen[record.id] = true;
      const value = record[field];
      return {
        count: summary.count + 1,
        total: summary.total + (value ?? 0),
        missing: summary.missing + (value === null ? 1 : 0),
      };
    },
    { count: 0, total: 0, missing: 0 },
  );
}

const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
  { id: "w-06", name: "%%mug%%", price: 18, acquired: true },
];

console.log(searchByText(items, "name", "%%queryUpper%%"));
console.log(filterByStatus(items, "acquired", false));
console.log(sortBy(items, "price"));
console.log(summarize(items, "price"));
