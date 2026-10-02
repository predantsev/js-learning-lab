// Statistics: rarely used. Export overdueShare(loans, today) by name.
// Keep the next line: it shows in the console when this module runs.
console.log("▶ stats.js");

import { countOverdue } from "./domain/loans.js";

// The share of open loans that are overdue, in whole percent.
export function overdueShare(loans, today) {
  const open = loans.filter((loan) => !loan.returned);
  if (open.length === 0) {
    return 0;
  }
  return Math.round((countOverdue(loans, today) / open.length) * 100);
}
