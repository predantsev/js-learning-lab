// Type tests: `npx tsc --noEmit` checks this file, nothing runs it. Every `@ts-expect-error` must meet a
// real type error on the next line; when the type stops refusing it, tsc reports the unused directive.
// tsc cannot see whether a number is whole: 845.5 is a number too, so the runtime contract
// (parseExpenseList, tested in src/capstone.test.tsx) refuses it.
import type { Expense } from '../../domain/expenses.ts';

export const valid: Expense = { id: 'e-01', label: 'Weekly groceries', amountMinor: 84550, date: '2026-03-01', category: 'food' };

// @ts-expect-error an amount is a number of kopiykas, not text in hryvnias
export const textAmount: Expense = { id: 'e-01', label: 'Weekly groceries', amountMinor: '845.50', date: '2026-03-01', category: 'food' };

// @ts-expect-error a category is one of the four of the project
export const unknownCategory: Expense = { id: 'e-01', label: 'Weekly groceries', amountMinor: 84550, date: '2026-03-01', category: 'gifts' };
