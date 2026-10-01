const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-05", name: "%%tickets%%", price: null },
];

// Another valid approach: a block body with if and two returns.
function toLabels(list) {
  return list.map((item) => {
    if (item.price === null) {
      return item.name + ": %%noPrice%%";
    }
    return item.name + ": " + item.price;
  });
}

console.log(toLabels(items));
