const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-03", name: "%%bicycle%%", price: 240, acquired: false },
];

const isWanted = (item) => !item.acquired;
const byPriceAsc = (a, b) => a.price - b.price;
const toLabel = (item) => item.name + ": " + item.price;

// The chain, one step per line: every intermediate array has a name, so it can be printed.
const step1 = items.filter(isWanted);
const step2 = step1.toSorted(byPriceAsc);
const step3 = step2.map(toLabel);

console.log(step1.map((item) => item.id));
console.log(step2.map((item) => item.id));
console.log(step3);
