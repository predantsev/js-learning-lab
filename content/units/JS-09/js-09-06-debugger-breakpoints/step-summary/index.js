function priceOf(item) {
  return item.price ?? 0;
}

function summarize(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += priceOf(items[i]);
  }
  return total;
}

const wishes = [
  { id: "w-01", price: 80 },
  { id: "w-02", price: 45 },
  { id: "w-05", price: null },
  { id: "w-03", price: 240 },
];
console.log(summarize(wishes));
