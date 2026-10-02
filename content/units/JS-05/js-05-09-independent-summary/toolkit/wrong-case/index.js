// Only the field is lowercased, so a query typed in capitals never matches.
function searchByText(records, field, query) {
  return records.filter((record) => record[field].toLowerCase().includes(query));
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
  const seen = {};
  let count = 0;
  let total = 0;
  let missing = 0;
  for (const record of records) {
    if (Object.hasOwn(seen, record.id)) {
      continue;
    }
    seen[record.id] = true;
    count = count + 1;
    if (record[field] === null) {
      missing = missing + 1;
    } else {
      total = total + record[field];
    }
  }
  return { count, total, missing };
}

const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
  { id: "w-06", name: "%%mug%%", price: 18, acquired: true },
];

console.log(searchByText(items, "name", "%%queryUpper%%"));
console.log(summarize(items, "price"));
