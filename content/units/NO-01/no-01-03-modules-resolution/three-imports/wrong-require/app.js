// Misconception: import and require are two spellings of the same thing. An ES module has no
// require, so the call throws a ReferenceError when summarize runs.
import { join } from 'node:path';
import { countCompletions, isActive } from './domain/habits.js';

export function summarize() {
  const { loadFixtures } = require('./fixtures-loader.cjs');
  const file = join(import.meta.dirname, 'habits.json');
  const habits = loadFixtures(file);
  return habits.filter(isActive).map((habit) => `${habit.name}: ${countCompletions(habit)}`);
}
