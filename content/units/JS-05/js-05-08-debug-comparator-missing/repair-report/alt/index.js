const expenses = [
  { id: "e-05", label: "%%cinema%%", amountMinor: 30000 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
];

// Another valid repair: a sorted copy with spread, a reduce over the records,
// an explicit undefined check and a plain loop for the unique total.
function sortByAmount(list) {
  return [...list].sort((a, b) => a.amountMinor - b.amountMinor);
}

function totalAmount(list) {
  return list.reduce((sum, expense) => sum + expense.amountMinor, 0);
}

function labelOf(list, id) {
  const found = list.find((expense) => expense.id === id);
  if (found === undefined) {
    return "%%unknown%%";
  }
  return found.label;
}

function uniqueTotal(list) {
  const seen = {};
  let sum = 0;
  for (const expense of list) {
    if (!Object.hasOwn(seen, expense.id)) {
      seen[expense.id] = true;
      sum = sum + expense.amountMinor;
    }
  }
  return sum;
}

console.log(sortByAmount(expenses).map((expense) => expense.id));
console.log(totalAmount(expenses), uniqueTotal(expenses));
console.log(labelOf(expenses, "e-01"), labelOf(expenses, "e-99"));
console.log(totalAmount([]), uniqueTotal([]));
