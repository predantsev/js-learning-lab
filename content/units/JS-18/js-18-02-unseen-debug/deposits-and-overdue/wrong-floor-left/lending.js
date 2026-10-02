// The rules of the tool library: pure functions, no page and no storage.
// A loan: { id: "L-01", tool: "…", depositUah: 150.4, dueDate: "YYYY-MM-DD", returnedOn: null | "YYYY-MM-DD" }.

// The deposits held for loans that are not returned yet, in kopiykas (a whole number).
export function heldDepositsMinor(loans) {
  let total = 0;
  for (const loan of loans) {
    if (loan.returnedOn === null) total += loan.depositUah;
  }
  return Math.floor(total * 100);
}

// Records a return: a new list in which the loan with this id has returnedOn set to day.
export function returnTool(loans, id, day) {
  return loans.map((loan) => (loan.id === id ? { ...loan, returnedOn: day } : loan));
}

// A loan is overdue when it is not returned and its due date is before today.
// A loan due today is not overdue yet.
export function isOverdue(loan, today) {
  return loan.returnedOn === null && loan.dueDate < today;
}

export function overdueLoans(loans, today) {
  return loans.filter((loan) => isOverdue(loan, today));
}
