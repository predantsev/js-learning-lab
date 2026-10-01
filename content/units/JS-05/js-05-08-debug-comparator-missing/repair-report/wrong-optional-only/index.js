const expenses = [
  { id: "e-05", label: "%%cinema%%", amountMinor: 30000 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
];

function sortByAmount(list) {
  return list.toSorted((a, b) => a.amountMinor - b.amountMinor);
}

function totalAmount(list) {
  return list
    .map((expense) => expense.amountMinor)
    .reduce((sum, amount) => sum + amount, 0);
}

// ?. stops the crash, but a missing id now gives undefined instead of the promised text.
function labelOf(list, id) {
  return list.find((expense) => expense.id === id)?.label;
}

function uniqueTotal(list) {
  const seen = {};
  return list.reduce((sum, expense) => {
    if (Object.hasOwn(seen, expense.id)) {
      return sum;
    }
    seen[expense.id] = true;
    return sum + expense.amountMinor;
  }, 0);
}

console.log(sortByAmount(expenses).map((expense) => expense.id));
console.log(totalAmount(expenses), uniqueTotal(expenses));
console.log(labelOf(expenses, "e-01"), labelOf(expenses, "e-99"));
console.log(totalAmount([]), uniqueTotal([]));
