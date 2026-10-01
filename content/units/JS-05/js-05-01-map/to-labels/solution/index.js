const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-05", name: "%%tickets%%", price: null },
];

// Return a new array with one label per item: "name: price".
// When the price is null, write "%%noPrice%%" instead of the price.
function toLabels(list) {
  return list.map((item) => item.name + ": " + (item.price ?? "%%noPrice%%"));
}

console.log(toLabels(items));
