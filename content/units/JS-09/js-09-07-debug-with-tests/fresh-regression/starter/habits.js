// How many completion days of the habit are on or after the day `from`.
export function completedSince(habit, from) {
  return habit.completions.filter((day) => day > from).length;
}
