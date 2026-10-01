const items = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-03", name: "%%bicycle%%", price: 240, acquired: false },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false },
];

// The old version: one long loop does everything.
function wantedLabelsLoop(list, query) {
  const found = [];
  for (const item of list) {
    const name = item.name.toLowerCase();
    if (!item.acquired && name.includes(query.toLowerCase())) {
      found.push(item);
    }
  }
  found.sort((a, b) => {
    if (a.price === b.price) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });
  const labels = [];
  for (const item of found) {
    labels.push(item.name + ": " + (item.price ?? "%%noPrice%%"));
  }
  return labels;
}

// The new version: small named steps joined in a chain.
const isWanted = (item) => {
  // your code here
};

const matchesQuery = (item, query) => {
  // your code here
};

const byPriceAsc = (a, b) => {
  // your code here
};

const toLabel = (item) => {
  // your code here
};

function wantedLabels(list, query) {
  // your code here: filter, filter, toSorted, map
}

console.log(wantedLabelsLoop(items, ""));
console.log(wantedLabels(items, ""));
