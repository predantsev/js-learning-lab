function isOnOrAfter(date, from) {
  return date > from;
}

function totalSince(expenses, from) {
  let total = 0;
  for (const expense of expenses) {
    if (isOnOrAfter(expense.date, from)) {
      total += expense.amountMinor;
    }
  }
  return total;
}

// The new test: an expense made exactly on the first day of the period is counted.
const expenses = [{ id: "e-01", date: "2026-03-01", amountMinor: 84550 }];
const actual = totalSince(expenses, "2026-03-01");
const expected = 84550;
console.log(actual === expected ? "%%pass%%" : `%%fail%% ${expected}, %%got%% ${actual}`);
