// date: a calendar date "YYYY-MM-DD"; n: a whole number of days (may be negative).
// Returns the calendar date n days later, also as "YYYY-MM-DD".
const DAY_MS = 24 * 60 * 60 * 1000;

function addCalendarDays(date, n) {
  // A date-only text is read as midnight UTC, and UTC has no daylight saving time,
  // so here every day really is 24 hours long.
  const start = new Date(date).getTime();
  return new Date(start + n * DAY_MS).toISOString().slice(0, 10);
}

console.log(addCalendarDays("2026-02-28", 1));
console.log(addCalendarDays("2026-03-07", 1));
console.log(addCalendarDays("2026-03-01", -1));
