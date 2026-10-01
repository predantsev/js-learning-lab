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

// sort runs on the list itself before filter, so the caller's list gets reordered.
function wantedLabels(list, query) {
  return list
    .sort(byPriceAsc)
    .filter(isWanted)
    .filter((item) => matchesQuery(item, query))
    .map(toLabel);
}

console.log(wantedLabels(items, ""));
