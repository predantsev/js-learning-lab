// handlers.js: three handlers of the expense list, measured in a release build (synthetic numbers). Do not edit.
export const expenseHandlers = [
  { name: 'recomputeCategoryTotals', when: 'during-swipe', ms: 24 },
  { name: 'trackSwipeDistance', when: 'during-swipe', ms: 10 },
  { name: 'saveExpensesToStorage', when: 'after-swipe', ms: 45 },
];
