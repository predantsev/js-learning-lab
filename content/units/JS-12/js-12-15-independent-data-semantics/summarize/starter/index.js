// Expense records as they arrive from a form or an import:
// { id, label, amountText, date } — amountText is typed text such as "845,50".
const records = [
  { id: "e-01", label: "%%groceries%%", amountText: "845,50", date: "2026-03-01" },
  { id: "e-02", label: "%%pass%%", amountText: "520", date: "2026-03-01" },
  { id: "e-02", label: "%%pass%%", amountText: "520", date: "2026-03-01" },
  { id: "e-03", label: "%%coffee%%", amountText: "0,10", date: "2026-02-28" },
];

// Returns { byId, count, totalMinor, display, search } — see the task.
function summarize(records, locale) {
  // Write the body of the function here.
}

const summary = summarize(records, "%%locale%%");
console.log(summary);
