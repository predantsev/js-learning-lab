// date: a calendar date "YYYY-MM-DD"; n: a whole number of days (may be negative).
// Returns the calendar date n days later, also as "YYYY-MM-DD".
const DAY_MS = 24 * 60 * 60 * 1000;

function addCalendarDays(date, n) {
  // Midnight UTC plus n days, but read back with the local getters.
  const moved = new Date(new Date(date).getTime() + n * DAY_MS);
  const month = String(moved.getMonth() + 1).padStart(2, "0");
  const day = String(moved.getDate()).padStart(2, "0");
  return moved.getFullYear() + "-" + month + "-" + day;
}

console.log(addCalendarDays("2026-02-28", 1));
console.log(addCalendarDays("2026-03-07", 1));
console.log(addCalendarDays("2026-03-01", -1));
