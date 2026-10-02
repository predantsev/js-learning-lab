// The rules of the loans. Export by name:
// - validateLoan(loan): { ok: true, value } or { ok: false, errors };
// - countOverdue(loans, today): how many loans are not returned and past their dueDate.
// Pure functions only: no page, no storage.

export function validateLoan(loan) {
  if (typeof loan !== "object" || loan === null) {
    return { ok: false, errors: { loan: "not-an-object" } };
  }
  const errors = {};
  if (typeof loan.id !== "string" || loan.id === "") {
    errors.id = "required";
  }
  if (typeof loan.title !== "string" || loan.title.trim() === "") {
    errors.title = "required";
  }
  if (typeof loan.dueDate !== "string" || loan.dueDate.length !== 10) {
    errors.dueDate = "not-a-day";
  }
  if (typeof loan.returned !== "boolean") {
    errors.returned = "not-boolean";
  }
  const hasErrors = Object.keys(errors).length > 0;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: loan };
}

export function countOverdue(loans, today) {
  return loans.filter((loan) => !loan.returned && loan.dueDate < today).length;
}
