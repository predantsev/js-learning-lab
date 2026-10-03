import { decision } from './decision.js';

const COSTS = ['find-in-page', 'keyboard-focus', 'screen-reader-context', 'scroll-restoration'];

test('realisticCount is the count from the task', () => {
  expect(decision.realisticCount, 'realisticCount').toBe(300);
});

test('both render times are measured and 5,000 tasks take longer', () => {
  expect(typeof decision.msAtRealistic, 'type of msAtRealistic').toBe('number');
  expect(typeof decision.msAt5000, 'type of msAt5000').toBe('number');
  expect(decision.msAtRealistic, 'msAtRealistic').toBeGreaterThan(0);
  expect(decision.msAt5000, 'msAt5000 compared with msAtRealistic').toBeGreaterThan(decision.msAtRealistic);
});

test('the choice follows the measurement at the realistic count', () => {
  if (typeof decision.msAtRealistic === 'number' && decision.msAtRealistic > 0 && decision.msAtRealistic <= 16) {
    expect(decision.choice, 'choice for a render within one frame').toBe('plain');
  } else {
    expect(['paging', 'windowing'], 'choice for a render longer than one frame').toContain(decision.choice);
  }
});

test('windowingCosts lists exactly what windowing costs', () => {
  expect(Array.isArray(decision.windowingCosts), 'windowingCosts is an array').toBe(true);
  expect([...decision.windowingCosts].sort(), 'windowingCosts, sorted').toEqual(COSTS);
});
