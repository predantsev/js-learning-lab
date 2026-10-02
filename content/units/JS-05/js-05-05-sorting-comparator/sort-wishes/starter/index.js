const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-05", name: "%%tickets%%", price: null },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-03", name: "%%bicycle%%", price: 240 },
  { id: "w-06", name: "%%mug%%", price: 18 },
];

// A comparator returns a number. Negative: a goes first. Positive: b goes first. 0: equal.

// 1. Cheaper first. Items without a price (null) go after all priced items.
function byPriceAsc(a, b) {
  // your code here
}

// 2. Alphabetical by name. Use localeCompare.
function byNameAsc(a, b) {
  // your code here
}

console.log(items.toSorted(byPriceAsc).map((item) => item.name));
console.log(items.toSorted(byNameAsc).map((item) => item.name));
