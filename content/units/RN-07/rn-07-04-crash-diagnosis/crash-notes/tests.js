import { diagnosis } from './diagnosis.js';

const steps = () => (Array.isArray(diagnosis?.steps) ? diagnosis.steps.filter((step) => typeof step === 'string' && step.trim().length >= 5) : []);

test('the first own frame is the first frame from src', () => {
  const frame = String(diagnosis?.firstOwnFrame ?? '');
  expect(frame.includes('ExpenseRow.tsx'), `firstOwnFrame is "${frame}"`).toBe(true);
  expect(/:31\b/.test(frame), `firstOwnFrame "${frame}" has line 31`).toBe(true);
});

test('the reproduction has at least three steps', () => {
  expect(steps().length, 'steps with at least 5 characters').toBeGreaterThanOrEqual(3);
});

test('the reproduction includes the action from the breadcrumbs', () => {
  expect(steps().some((step) => step.toLowerCase().includes(L.csv.toLowerCase())), `a step mentions "${L.csv}"`).toBe(true);
});

test('the hypothesis names the function of that frame', () => {
  expect(String(diagnosis?.hypothesis ?? '').includes('ExpenseRow'), 'hypothesis mentions ExpenseRow').toBe(true);
});
