// Simple streak (read-only): consecutive completed days ending on `today` ('YYYY-MM-DD' strings).
function previousDay(date) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

export function currentStreak(completions, today) {
  const done = new Set(completions);
  let streak = 0;
  for (let day = today; done.has(day); day = previousDay(day)) streak += 1;
  return streak;
}
