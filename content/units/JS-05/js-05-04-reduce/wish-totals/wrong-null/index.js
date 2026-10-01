const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, category: "%%tech%%" },
  { id: "w-02", name: "%%lamp%%", price: 45, category: "%%home%%" },
  { id: "w-05", name: "%%tickets%%", price: null, category: null },
  { id: "w-06", name: "%%mug%%", price: 18, category: "%%home%%" },
];

// Works for null only by accident (null + 45 is 45); a missing price field gives NaN.
function totalPrice(list) {
  return list.reduce((sum, item) => sum + item.price, 0);
}

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
