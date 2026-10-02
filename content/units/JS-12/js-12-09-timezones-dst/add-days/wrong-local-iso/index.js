// date: a calendar date "YYYY-MM-DD"; n: a whole number of days (may be negative).
// Returns the calendar date n days later, also as "YYYY-MM-DD".
function addCalendarDays(date, n) {
  const [year, month, day] = date.split("-").map(Number);
  // Local midnight of the new day, but written out in UTC.
  return new Date(year, month - 1, day + n).toISOString().slice(0, 10);
}

console.log(addCalendarDays("2026-02-28", 1));
console.log(addCalendarDays("2026-03-07", 1));
console.log(addCalendarDays("2026-03-01", -1));
