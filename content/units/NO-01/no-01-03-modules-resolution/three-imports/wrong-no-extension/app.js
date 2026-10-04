// Misconception: Node finds './domain/habits' the way a bundler does. In an ES module the
// specifier must name the file exactly, extension included.
import { join } from 'node:path';
import { countCompletions, isActive } from './domain/habits';
import fixturesLoader from './fixtures-loader.cjs';

const { loadFixtures } = fixturesLoader;

export function summarize() {
  const file = join(import.meta.dirname, 'habits.json');
  const habits = loadFixtures(file);
  return habits.filter(isActive).map((habit) => `${habit.name}: ${countCompletions(habit)}`);
}
