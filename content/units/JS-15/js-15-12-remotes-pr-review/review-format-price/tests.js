import { formatPrice as after } from './after.js';
import { review } from './review.js';

// The correct text, computed with integers only.
const correct = (amountMinor) => `${Math.floor(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, '0')} UAH`;
const text = (value) => (typeof value === 'string' ? value.trim() : '');

test('failingInput is a whole number of minor units', () => {
  expect(Number.isInteger(review.failingInput), 'failingInput is a whole number').toBe(true);
  expect(review.failingInput, 'failingInput').toBeGreaterThanOrEqual(0);
});

test('expected is the correct text for failingInput', () => {
  expect(review.expected, 'expected').toBe(correct(review.failingInput));
});

test('the new formatPrice really gives a wrong text for failingInput', () => {
  expect(after(review.failingInput) === correct(review.failingInput), 'the new formatPrice is correct for failingInput').toBe(false);
});

test('the defect comment names the failing case', () => {
  const comment = text(review.defectComment);
  // The correct price may be named with or without the currency ("12.05 UAH" or "12.05").
  const price = text(review.expected).replace(/\s*UAH$/, '');
  const namesIt = comment.includes(String(review.failingInput)) || (price !== '' && comment.includes(price));
  expect(namesIt, 'defectComment mentions failingInput or the expected text').toBe(true);
});

test('the question is a real question', () => {
  const question = text(review.question);
  expect(question.length, 'length of question').toBeGreaterThanOrEqual(10);
  expect(question.endsWith('?'), 'question ends with ?').toBe(true);
});

test('the decision is request-changes', () => {
  expect(review.decision).toBe('request-changes');
});

test('the reason explains the decision', () => {
  expect(text(review.reason).length, 'length of reason').toBeGreaterThanOrEqual(15);
});
