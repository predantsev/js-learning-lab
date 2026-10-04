// Another valid solution: a default import of node:path and the loader called through its object.
import path from 'node:path';
import * as habits from './domain/habits.js';
import loader from './fixtures-loader.cjs';

export function summarize() {
  const file = path.join(import.meta.dirname, 'habits.json');
  return loader
    .loadFixtures(file)
    .filter(habits.isActive)
    .map((habit) => `${habit.name}: ${habits.countCompletions(habit)}`);
}
