// The privacy declaration of the expense tracker's backup: one line per field of data-flow.js.
// Each line: { field, collected: true | false, purpose: one of PURPOSES or null, where: 'sent' | 'device' | 'none' }
export const declaration = [
  { field: 'expenseRecord', collected: false, purpose: null, where: 'device' },
];
