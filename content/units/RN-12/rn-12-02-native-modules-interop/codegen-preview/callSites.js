// callSites.js: where the app calls the module, with the values it passes.
export const callSites = [
  { file: 'AddExpense.tsx', method: 'addAmount', args: ['e-07', 210.5] },
  { file: 'MonthCard.tsx', method: 'getMonthTotal', args: ['2026-03'] },
  { file: 'ImportScreen.tsx', method: 'addMany', args: [['e-08', 'e-09'], [480, 95]] },
];

// Does one value fit one spec type? (string, number, boolean, string[], number[], …)
export function fits(value, type) {
  const arrayOf = type.match(/^(\w+)\[\]$/)?.[1] ?? type.match(/^Array<(\w+)>$/)?.[1];
  if (arrayOf) return Array.isArray(value) && value.every((item) => typeof item === arrayOf);
  return typeof value === type;
}
