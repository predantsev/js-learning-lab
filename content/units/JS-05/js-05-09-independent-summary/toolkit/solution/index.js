// Four functions for ANY list of records: wishes, tasks, habits or expenses.
// The field name comes in the field parameter. None of them may change the list it receives.

// 1. Records whose text field contains the query, ignoring upper and lower case.
//    An empty query keeps every record.
function searchByText(records, field, query) {
  const needle = query.toLowerCase();
  return records.filter((record) => record[field].toLowerCase().includes(needle));
}

// 2. Records whose field is exactly equal (===) to value.
function filterByStatus(records, field, value) {
  return records.filter((record) => record[field] === value);
}

// 3. A NEW array sorted by field from smallest to largest: numbers by size,
//    text alphabetically (localeCompare). Records whose field is null go last.
//    Records with equal values keep their order.
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

// 4. A summary { count, total, missing } in which every id counts only once:
//    count   – how many different ids there are,
//    total   – the sum of field over those records, skipping null,
//    missing – how many of those records have null in field.
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
console.log(filterByStatus(items, "acquired", false));
console.log(sortBy(items, "price"));
console.log(summarize(items, "price"));
