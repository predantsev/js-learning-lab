import { formatDay } from "./dates.js";
export function loanLabel(loan) {
  return loan.title + " — " + formatDay(loan.dueDate);
}
