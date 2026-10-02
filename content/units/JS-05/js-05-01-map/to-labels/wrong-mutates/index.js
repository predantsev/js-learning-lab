const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-05", name: "%%tickets%%", price: null },
];

// The labels are right, but the callback writes a new field into every shared record.
function toLabels(list) {
  return list.map((item) => {
    item.label = item.name + ": " + (item.price ?? "%%noPrice%%");
    return item.label;
  });
}

console.log(toLabels(items));
