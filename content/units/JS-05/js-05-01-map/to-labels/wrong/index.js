const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-05", name: "%%tickets%%", price: null },
];

// The new array is built, but toLabels never returns it.
function toLabels(list) {
  list.map((item) => item.name + ": " + (item.price ?? "%%noPrice%%"));
}

console.log(toLabels(items));
