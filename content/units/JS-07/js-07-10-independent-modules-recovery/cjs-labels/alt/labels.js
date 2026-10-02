import { formatDay } from "./dates.js";

function loanLabel(loan) {
  return loan.title + " — " + formatDay(loan.dueDate);
}

export { loanLabel };
