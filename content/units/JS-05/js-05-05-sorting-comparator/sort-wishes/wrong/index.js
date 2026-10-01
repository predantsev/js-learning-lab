const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-05", name: "%%tickets%%", price: null },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-03", name: "%%bicycle%%", price: 240 },
  { id: "w-06", name: "%%mug%%", price: 18 },
];

// A boolean comparator: it never says "a first", so the order is not sorted.
function byPriceAsc(a, b) {
  return a.price > b.price;
}

function byNameAsc(a, b) {
  return a.name.localeCompare(b.name);
}

console.log(items.toSorted(byPriceAsc).map((item) => item.name));
console.log(items.toSorted(byNameAsc).map((item) => item.name));
