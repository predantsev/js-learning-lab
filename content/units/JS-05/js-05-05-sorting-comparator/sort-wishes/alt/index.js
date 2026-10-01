const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-05", name: "%%tickets%%", price: null },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-03", name: "%%bicycle%%", price: 240 },
  { id: "w-06", name: "%%mug%%", price: 18 },
];

// Another valid approach: name the "missing" checks first, then decide with ternaries.
function byPriceAsc(a, b) {
  const aMissing = a.price === null;
  const bMissing = b.price === null;
  if (aMissing || bMissing) {
    return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  }
  return a.price - b.price;
}

function byNameAsc(a, b) {
  return a.name.localeCompare(b.name);
}

console.log(items.toSorted(byPriceAsc).map((item) => item.name));
console.log(items.toSorted(byNameAsc).map((item) => item.name));
