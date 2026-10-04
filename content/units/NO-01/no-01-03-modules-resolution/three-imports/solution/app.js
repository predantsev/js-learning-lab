// Summary of the active habits: "<name>: <number of completions>", one line per habit.
import { join } from 'node:path';
import { countCompletions, isActive } from './domain/habits.js';
// A CommonJS module always works as a default import: it is the whole module.exports object.
import fixturesLoader from './fixtures-loader.cjs';

const { loadFixtures } = fixturesLoader;

export function summarize() {
  const file = join(import.meta.dirname, 'habits.json');
  const habits = loadFixtures(file);
  return habits.filter(isActive).map((habit) => `${habit.name}: ${countCompletions(habit)}`);
}
