// Another valid solution: createRequire gives an ES module its own require() for CommonJS files.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { countCompletions, isActive } from './domain/habits.js';

const require = createRequire(import.meta.url);
const { loadFixtures } = require('./fixtures-loader.cjs');

export function summarize() {
  const file = join(import.meta.dirname, 'habits.json');
  const habits = loadFixtures(file);
  return habits.filter(isActive).map((habit) => `${habit.name}: ${countCompletions(habit)}`);
}
