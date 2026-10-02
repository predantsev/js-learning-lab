// date: a calendar date "YYYY-MM-DD"; n: a whole number of days (may be negative).
// Returns the calendar date n days later, also as "YYYY-MM-DD".
function addCalendarDays(date, n) {
  const [year, month, day] = date.split("-").map(Number);
  const moved = new Date(Date.UTC(year, month, day + n));
  return moved.toISOString().slice(0, 10);
}

console.log(addCalendarDays("2026-02-28", 1));
console.log(addCalendarDays("2026-03-07", 1));
console.log(addCalendarDays("2026-03-01", -1));
