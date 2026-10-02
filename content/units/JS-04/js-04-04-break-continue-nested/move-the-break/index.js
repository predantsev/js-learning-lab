// Expenses grouped by category.
// Amounts are in minor units: 20000 is 200.00.
const groups = [
  { category: "food", amounts: [84550, 21050] },
  { category: "home", amounts: [] },
  { category: "fun", amounts: [18000, 30000] },
];

// For each category, print the first expense over 200.00.
for (let g = 0; g < groups.length; g++) {
  const amounts = groups[g].amounts;
  console.log(groups[g].category);
  for (let a = 0; a < amounts.length; a++) {
    if (amounts[a] > 20000) {
      console.log("%%over%%", amounts[a]);
      break;
    }
  }
}
