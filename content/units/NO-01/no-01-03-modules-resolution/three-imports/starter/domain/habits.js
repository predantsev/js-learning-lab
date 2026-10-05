// Habit domain functions (read-only), shared with the browser app.
export function countCompletions(habit) {
  return habit.completions.length;
}

export function isActive(habit) {
  return habit.active === true;
}
