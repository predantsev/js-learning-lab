import * as note from './evidence.js';
import { HABIT_COUNT } from './page.js';

const evidence = () => {
  expect(typeof note.evidence, 'type of the evidence export of evidence.js').toBe('object');
  return note.evidence;
};
const isPositive = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
// Function names declared in page.js: `function name(` and `const name = (`.
const pageFunctions = () => [...files['page.js'].matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(|const\s+([A-Za-z_$][\w$]*)\s*=\s*\(/g)].map((m) => m[1] ?? m[2]);

test('the note names the interaction', () => {
  expect(typeof evidence().interaction, 'type of interaction').toBe('string');
  expect(evidence().interaction.trim().length, 'length of interaction').toBeGreaterThan(0);
});

test('the note records the dataset size of the page', () => {
  expect(evidence().habits, 'habits in the note').toBe(HABIT_COUNT);
});

test('the long task lasts more than 50 ms', () => {
  expect(isPositive(evidence().longTaskMs), 'longTaskMs is a positive number').toBe(true);
  expect(evidence().longTaskMs, 'longTaskMs').toBeGreaterThan(50);
});

test('three different entries by self time, one of them a function of page.js', () => {
  const names = evidence().topSelfTime;
  expect(Array.isArray(names) && names.length, 'number of names in topSelfTime').toBe(3);
  expect(names.every((name) => typeof name === 'string' && name.trim() !== ''), 'every name is text that is not empty').toBe(true);
  expect(new Set(names.map((name) => name.trim())).size, 'different names in topSelfTime').toBe(3);
  const own = pageFunctions();
  expect(names.some((name) => own.includes(name.trim())), `one of the names is a function of page.js (${own.join(', ')})`).toBe(true);
});

test('both heap sizes are recorded', () => {
  expect(isPositive(evidence().heapBeforeMB), 'heapBeforeMB is a positive number').toBe(true);
  expect(isPositive(evidence().heapAfterMB), 'heapAfterMB is a positive number').toBe(true);
});
