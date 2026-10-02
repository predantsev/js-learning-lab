// date: a calendar date "YYYY-MM-DD"; n: a whole number of days (may be negative).
// Returns the calendar date n days later, also as "YYYY-MM-DD".
function addCalendarDays(date, n) {
  const [year, month, day] = date.split("-");
  const newDay = String(Number(day) + n).padStart(2, "0");
  return year + "-" + month + "-" + newDay;
}

console.log(addCalendarDays("2026-02-28", 1));
console.log(addCalendarDays("2026-03-07", 1));
console.log(addCalendarDays("2026-03-01", -1));
