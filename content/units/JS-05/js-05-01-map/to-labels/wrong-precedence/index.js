const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-05", name: "%%tickets%%", price: null },
];

// Without brackets + runs first: ?? sees the joined text "...: null", which is never null.
function toLabels(list) {
  return list.map((item) => item.name + ": " + item.price ?? "%%noPrice%%");
}

console.log(toLabels(items));
