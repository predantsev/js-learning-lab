// summarize adds every record, so a record that occurs twice is counted twice.
function searchByText(records, field, query) {
  const needle = query.toLowerCase();
  return records.filter((record) => record[field].toLowerCase().includes(needle));
}

function filterByStatus(records, field, value) {
  return records.filter((record) => record[field] === value);
}

function sortBy(records, field) {
  return records.toSorted((a, b) => {
    const x = a[field];
    const y = b[field];
    if (x === y) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    if (typeof x === "number") return x - y;
    return x.localeCompare(y);
  });
}

function summarize(records, field) {
  return records.reduce(
    (summary, record) => ({
      count: summary.count + 1,
      total: summary.total + (record[field] ?? 0),
      missing: summary.missing + (record[field] === null ? 1 : 0),
    }),
    { count: 0, total: 0, missing: 0 },
  );
}

const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
  { id: "w-06", name: "%%mug%%", price: 18, acquired: true },
];

console.log(sortBy(items, "price"));
console.log(summarize(items, "price"));
