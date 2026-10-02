const { formatDay } = require("./dates.js");
export function loanLabel(loan) {
  return loan.title + " — " + formatDay(loan.dueDate);
}
