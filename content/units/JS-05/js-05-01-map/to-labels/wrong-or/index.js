const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-05", name: "%%tickets%%", price: null },
];

// || replaces every falsy value, so a price of 0 also becomes "%%noPrice%%".
function toLabels(list) {
  return list.map((item) => item.name + ": " + (item.price || "%%noPrice%%"));
}

console.log(toLabels(items));
