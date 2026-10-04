// summarize() must read habits.json through the CommonJS loader and use the domain functions.
import { summarize } from './app.js';

test('prints one line per active habit with its completion count', () => {
  expect(typeof summarize, 'type of summarize').toBe('function');
  expect(summarize(), 'summarize()').toEqual([`${L.morning}: 3`, `${L.water}: 1`, `${L.walk}: 0`]);
});
