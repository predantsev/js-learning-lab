// dueDate: a "YYYY-MM-DD" string or null (no due date).
// today: the current day as a "YYYY-MM-DD" string, passed in by the caller.
// true when the task is due on that day or earlier.
function isDueOnOrBefore(dueDate, today) {
  if (dueDate === null) {
    return false;
  }
  return new Date(dueDate).getUTCDate() <= new Date(today).getUTCDate();
}

console.log(isDueOnOrBefore("2026-03-01", "2026-03-02"));
console.log(isDueOnOrBefore("2026-03-10", "2026-03-02"));
console.log(isDueOnOrBefore(null, "2026-03-02"));
