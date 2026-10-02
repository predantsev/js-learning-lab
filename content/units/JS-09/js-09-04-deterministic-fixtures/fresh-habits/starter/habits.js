// How many habits are active (not paused).
export function countActive(habits) {
  return habits.filter((habit) => habit.active).length;
}
