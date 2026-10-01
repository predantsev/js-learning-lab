const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-03", name: "%%bicycle%%", price: 240, acquired: false },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
];

const isWanted = (item) => !item.acquired;

const matchesQuery = (item, query) => item.name.toLowerCase().includes(query.toLowerCase());

const byPriceAsc = (a, b) => {
  if (a.price === b.price) return 0;
  if (a.price === null) return 1;
  if (b.price === null) return -1;
  return a.price - b.price;
};

const toLabel = (item) => item.name + ": " + (item.price ?? "%%noPrice%%");

// map comes first: every later step receives strings instead of records.
function wantedLabels(list, query) {
  return list
    .map(toLabel)
    .filter(isWanted)
    .filter((item) => matchesQuery(item, query))
    .toSorted(byPriceAsc);
}

console.log(wantedLabels(items, ""));
