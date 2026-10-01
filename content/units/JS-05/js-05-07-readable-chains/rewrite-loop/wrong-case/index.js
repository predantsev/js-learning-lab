const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-03", name: "%%bicycle%%", price: 240, acquired: false },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
];

const isWanted = (item) => !item.acquired;

// Only the name is lowercased, so a query typed in capitals never matches.
const matchesQuery = (item, query) => item.name.toLowerCase().includes(query);

const byPriceAsc = (a, b) => {
  if (a.price === b.price) return 0;
  if (a.price === null) return 1;
  if (b.price === null) return -1;
  return a.price - b.price;
};

const toLabel = (item) => item.name + ": " + (item.price ?? "%%noPrice%%");

function wantedLabels(list, query) {
  return list
    .filter(isWanted)
    .filter((item) => matchesQuery(item, query))
    .toSorted(byPriceAsc)
    .map(toLabel);
}

console.log(wantedLabels(items, ""));
