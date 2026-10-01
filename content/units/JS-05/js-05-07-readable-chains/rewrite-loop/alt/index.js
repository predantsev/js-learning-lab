const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-03", name: "%%bicycle%%", price: 240, acquired: false },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
];

// Another valid approach: block bodies with return, one combined filter,
// and sort on the intermediate array (filter already made a new one). The old loop is gone.
const isWanted = (item) => {
  return item.acquired === false;
};

const matchesQuery = (item, query) => {
  const name = item.name.toLowerCase();
  return name.includes(query.toLowerCase());
};

const byPriceAsc = (a, b) => {
  const aMissing = a.price === null;
  const bMissing = b.price === null;
  if (aMissing || bMissing) {
    return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  }
  return a.price - b.price;
};

const toLabel = (item) => {
  return item.name + ": " + (item.price ?? "%%noPrice%%");
};

function wantedLabels(list, query) {
  const wanted = list.filter((item) => isWanted(item) && matchesQuery(item, query));
  return wanted.sort(byPriceAsc).map(toLabel);
}

console.log(wantedLabels(items, ""));
