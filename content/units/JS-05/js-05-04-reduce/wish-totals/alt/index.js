const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, category: "%%tech%%" },
  { id: "w-02", name: "%%lamp%%", price: 45, category: "%%home%%" },
  { id: "w-05", name: "%%tickets%%", price: null, category: null },
  { id: "w-06", name: "%%mug%%", price: 18, category: "%%home%%" },
];

// Another valid approach: a typeof check in the reducer, and a plain loop for the counters.
function totalPrice(list) {
  return list.reduce((sum, item) => (typeof item.price === "number" ? sum + item.price : sum), 0);
}

function countByCategory(list) {
  const counts = {};
  for (const item of list) {
    const key = item.category ?? "none";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

console.log(totalPrice(items));
console.log(countByCategory(items));
console.log(totalPrice([]), countByCategory([]));
