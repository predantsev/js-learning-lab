// Is the date ("YYYY-MM-DD") on or after the first day of the period?
export function isOnOrAfter(date, from) {
  return date > from;
}

// The total in minor units of the expenses made on or after the day `from`.
export function totalSince(expenses, from) {
  let total = 0;
  for (const expense of expenses) {
    if (isOnOrAfter(expense.date, from)) {
      total += expense.amountMinor;
    }
  }
  return total;
}
