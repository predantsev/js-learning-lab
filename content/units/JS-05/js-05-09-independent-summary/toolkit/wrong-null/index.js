// The comparator never handles null: a subtraction treats it like 0, and for text it is
// compared as the word "null" (or subtracted when it comes first), so it never goes last.
function searchByText(records, field, query) {
  const needle = query.toLowerCase();
  return records.filter((record) => record[field].toLowerCase().includes(needle));
}

function filterByStatus(records, field, value) {
  return records.filter((record) => record[field] === value);
}

function sortBy(records, field) {
  return records.toSorted((a, b) => {
    if (typeof a[field] === "string") {
      return a[field].localeCompare(b[field]);
    }
    return a[field] - b[field];
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

console.log(sortBy(items, "price"));
console.log(summarize(items, "price"));
