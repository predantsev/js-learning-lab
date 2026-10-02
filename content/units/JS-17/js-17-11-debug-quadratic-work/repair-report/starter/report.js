// The habit report. Something here is slow on big data, something sometimes crashes,
// and the streak is sometimes wrong. Find all three with measurements, not guesses.

// The share of the given days on which the habit was completed.
export function completionRate(completions, days) {
  if (days.length === 0) return 0;
  const done = days.map((day) => completions.includes(day));
  return done.filter(Boolean).length / days.length;
}

// "Health › Sport": the names from the root category down to this one.
export function categoryPath(categoryId, categoriesById) {
  const category = categoriesById.get(categoryId);
  if (category.parentId === null) return category.name;
  return categoryPath(category.parentId, categoriesById) + " › " + category.name;
}

// The completions from this device and from an imported file: sorted ascending, every date once.
export function mergeCompletions(local, imported) {
  const merged = [...local];
  for (const day of imported) {
    if (!merged.includes(day)) merged.push(day);
  }
  return merged;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const previousDay = (day) => new Date(Date.parse(day + "T00:00:00Z") - DAY_MS).toISOString().slice(0, 10);

// Consecutive completed days that end on `today`. Relies on sorted completions.
export function currentStreak(completions, today) {
  let streak = 0;
  let expected = today;
  for (let i = completions.length - 1; i >= 0 && completions[i] === expected; i--) {
    streak = streak + 1;
    expected = previousDay(expected);
  }
  return streak;
}

export function buildHabitReport(habit, categoriesById, days, today) {
  return {
    name: habit.name,
    category: categoryPath(habit.categoryId, categoriesById),
    rate: completionRate(habit.completions, days),
    streak: currentStreak(habit.completions, today),
  };
}
