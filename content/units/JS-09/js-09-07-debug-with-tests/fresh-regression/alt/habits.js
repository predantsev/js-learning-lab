// How many completion days of the habit are on or after the day `from`.
export function completedSince(habit, from) {
  let count = 0;
  for (const day of habit.completions) {
    if (!(day < from)) {
      count += 1;
    }
  }
  return count;
}
