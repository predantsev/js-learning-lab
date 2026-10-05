import * as budget from './budget.js';
import { expenseHandlers } from './handlers.js';

const guard = (name) => expect(typeof budget[name], `type of ${name}`).toBe('function');

test('one frame lasts 1000 / hz milliseconds', () => {
  guard('frameBudgetMs');
  expect(budget.frameBudgetMs(60), 'frameBudgetMs(60)').toBeCloseTo(16.67, 2);
  expect(budget.frameBudgetMs(120), 'frameBudgetMs(120)').toBeCloseTo(8.33, 2);
  expect(budget.frameBudgetMs(90), 'frameBudgetMs(90)').toBeCloseTo(11.11, 2);
});

test('at 60 Hz only the slow handler that runs during the swipe is moved', () => {
  guard('handlersToMove');
  expect(budget.handlersToMove(expenseHandlers, 60), 'handlersToMove(expenseHandlers, 60)').toEqual(['recomputeCategoryTotals']);
});

test('at 120 Hz a 10 ms handler no longer fits into a frame', () => {
  guard('handlersToMove');
  expect(budget.handlersToMove(expenseHandlers, 120), 'handlersToMove(expenseHandlers, 120)').toEqual(['recomputeCategoryTotals', 'trackSwipeDistance']);
});

test('a handler that runs only after the swipe is never moved, however slow', () => {
  guard('handlersToMove');
  const handlers = [{ name: 'exportReport', when: 'after-swipe', ms: 900 }];
  expect(budget.handlersToMove(handlers, 60), 'handlersToMove for an after-swipe handler of 900 ms').toEqual([]);
});

test('a handler that takes exactly one frame still fits', () => {
  guard('handlersToMove');
  const handlers = [
    { name: 'exactlyOneFrame', when: 'during-swipe', ms: 20 },
    { name: 'oneMore', when: 'during-swipe', ms: 21 },
  ];
  expect(budget.handlersToMove(handlers, 50), 'handlersToMove at 50 Hz (a 20 ms budget)').toEqual(['oneMore']);
});
