const expenses = [
  { id: "e-05", label: "%%cinema%%", amountMinor: 30000 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
];

// Expenses from the smallest amount to the largest. The list itself stays as it is.
function sortByAmount(list) {
  return list.toSorted((a, b) => a.amountMinor > b.amountMinor);
}

// The total of all amounts. An empty list gives 0.
function totalAmount(list) {
  return list
    .map((expense) => expense.amountMinor)
    .reduce((sum, amount) => sum + amount);
}

// The label of the expense with this id, or "%%unknown%%" when there is none.
function labelOf(list, id) {
  return list.find((expense) => expense.id === id).label;
}

// The total where every expense (every id) counts only once.
function uniqueTotal(list) {
  return list.reduce((sum, expense) => sum + expense.amountMinor, 0);
}

console.log(sortByAmount(expenses).map((expense) => expense.id));
console.log(totalAmount(expenses), uniqueTotal(expenses));
console.log(labelOf(expenses, "e-01"), labelOf(expenses, "e-99"));
console.log(totalAmount([]), uniqueTotal([]));
