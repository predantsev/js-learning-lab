// Misconception: a CommonJS file gives named imports like an ES module. Its exports are assigned
// as a whole object at the end, so Node cannot see the name loadFixtures in advance.
import { join } from 'node:path';
import { countCompletions, isActive } from './domain/habits.js';
import { loadFixtures } from './fixtures-loader.cjs';

export function summarize() {
  const file = join(import.meta.dirname, 'habits.json');
  const habits = loadFixtures(file);
  return habits.filter(isActive).map((habit) => `${habit.name}: ${countCompletions(habit)}`);
}
