function readAmount(expense) {
  if (expense.amountMinor <= 0) {
    throw new RangeError("amount must be above 0");
  }
  return expense.amountMinor;
}

function addToTotal(total, expense) {
  const amount = readAmount(expense);
  console.log("added " + expense.id);
  return total + amount;
}

function sumAll(expenses) {
  let total = 0;
  for (const expense of expenses) {
    total = addToTotal(total, expense);
  }
  return total;
}

let busy = true;
try {
  const total = sumAll([
    { id: "e-04", amountMinor: 9990 },
    { id: "e-07", amountMinor: -500 },
  ]);
  console.log("total " + total);
} catch (error) {
  console.log("caught: " + error.message);
} finally {
  busy = false;
}
console.log("busy " + busy);
