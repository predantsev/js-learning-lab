// Summary of the active habits: "<name>: <number of completions>", one line per habit.
// Add three imports at the top of this file:
//   join             from the built-in path module
//   countCompletions and isActive from domain/habits.js
//   loadFixtures     from the CommonJS file fixtures-loader.cjs

export function summarize() {
  const file = join(import.meta.dirname, 'habits.json');
  const habits = loadFixtures(file);
  return habits.filter(isActive).map((habit) => `${habit.name}: ${countCompletions(habit)}`);
}
