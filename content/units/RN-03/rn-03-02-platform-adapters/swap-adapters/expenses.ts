// expenses.ts: pure domain code shared by web and native. No platform, no storage, no Intl.
export interface Expense {
  id: string;
  label: string;
  amountMinor: number;
  date: string;
  category: string;
}

export function summarizeExpenses(expenses: Expense[]): { totalMinor: number; count: number } {
  return {
    totalMinor: expenses.reduce((sum, expense) => sum + expense.amountMinor, 0),
    count: expenses.length,
  };
}

export function removeExpense(expenses: Expense[], id: string): Expense[] {
  return expenses.filter((expense) => expense.id !== id);
}
