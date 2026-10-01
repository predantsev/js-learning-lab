const groups = [
  { category: "tech", prices: [80, null, 240, 300] },
  { category: "home", prices: [] },
  { category: "sport", prices: [null, 150] },
];

for (let g = 0; g < groups.length; g++) {
  const prices = groups[g].prices;
  for (let p = 0; p < prices.length; p++) {
    if (prices[p] === null) {
      continue;
    }
    if (prices[p] > 100) {
      console.log(groups[g].category, prices[p]);
      break;
    }
  }
}

let found = null;
search: for (let g = 0; g < groups.length; g++) {
  const prices = groups[g].prices;
  for (let p = 0; p < prices.length; p++) {
    if (prices[p] > 200) {
      found = prices[p];
      break search;
    }
  }
}
console.log("found:", found);
