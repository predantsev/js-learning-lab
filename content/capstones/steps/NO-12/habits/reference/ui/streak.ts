// The current streak of a habit: how many days in a row up to `today` it was completed. A day that is
// not completed yet today does not break the streak: then it counts up to yesterday. Dates are
// "YYYY-MM-DD"; the day before is computed in UTC, so no time zone or summer time shifts a day.
export function previousDay(day: string): string {
  return new Date(Date.parse(day + "T00:00:00Z") - 86_400_000).toISOString().slice(0, 10);
}

export function streakOf(completions: readonly string[], today: string): number {
  const done = new Set(completions);
  let day = done.has(today) ? today : previousDay(today);
  let count = 0;
  while (done.has(day)) {
    count = count + 1;
    day = previousDay(day);
  }
  return count;
}
