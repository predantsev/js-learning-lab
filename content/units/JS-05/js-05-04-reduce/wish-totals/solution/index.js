const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, category: "%%tech%%" },
  { id: "w-02", name: "%%lamp%%", price: 45, category: "%%home%%" },
  { id: "w-05", name: "%%tickets%%", price: null, category: null },
  { id: "w-06", name: "%%mug%%", price: 18, category: "%%home%%" },
];

// 1. The sum of all prices. Skip items without a price (null or no price field).
//    An empty list gives 0.
function totalPrice(list) {
  return list.reduce((sum, item) => sum + (item.price ?? 0), 0);
}

// 2. An object with the number of items in each category, for example { "%%home%%": 2 }.
//    Items without a category (null) are counted under the key "none".
function countByCategory(list) {
  return list.reduce((counts, item) => {
    const key = item.category ?? "none";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

console.log(totalPrice(items));
console.log(countByCategory(items));
console.log(totalPrice([]), countByCategory([]));
