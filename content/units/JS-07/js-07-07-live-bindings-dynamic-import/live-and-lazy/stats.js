console.log("▶ stats.js");

// describeStreak(days): a sentence about the streak, for the statistics view.
export function describeStreak(days) {
  if (days === 0) {
    return "%%noStreak%%";
  }
  return "%%streakOf%%" + days;
}
