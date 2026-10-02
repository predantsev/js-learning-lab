const { formatDay } = require("./dates.js");
function loanLabel(loan) {
  return loan.title + " — " + formatDay(loan.dueDate);
}
module.exports = { loanLabel };
