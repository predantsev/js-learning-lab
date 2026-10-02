// Another valid approach: binary search over the sorted completions instead of a Set.
// The habit report: an indexed completion rate, a category path that stops on a cycle,
// and a merge that keeps completions sorted and unique.

// The share of the given days on which the habit was completed.
export function completionRate(completions, days) {
  if (days.length === 0) return 0;
  // Completions are sorted (the invariant), so every day is found by binary search.
  let done = 0;
  for (const day of days) {
    let low = 0;
    let high = completions.length - 1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const value = completions[middle];
      if (value === day) {
        done = done + 1;
        break;
      }
      if (value < day) low = middle + 1;
      else high = middle - 1;
    }
  }
  return done / days.length;
}

// "Health › Sport": the names from the root category down to this one.
export function categoryPath(categoryId, categoriesById, seen = new Set()) {
  if (seen.has(categoryId)) {
    throw new Error(`%%cycle%% ${categoryId}`);
  }
  seen.add(categoryId);
  const category = categoriesById.get(categoryId);
  if (category.parentId === null) return category.name;
  return categoryPath(category.parentId, categoriesById, seen) + " › " + category.name;
}

// The completions from this device and from an imported file: sorted ascending, every date once.
export function mergeCompletions(local, imported) {
  return [...new Set([...local, ...imported])].toSorted();
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
