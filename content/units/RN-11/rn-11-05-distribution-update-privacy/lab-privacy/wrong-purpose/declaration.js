// The receipt photo is declared for another purpose than the data flow says.
export const declaration = [
  { field: 'expenseRecord', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'receiptPhoto', collected: true, purpose: 'analytics', where: 'sent' },
  { field: 'photoLocation', collected: false, purpose: null, where: 'none' },
  { field: 'themePreference', collected: false, purpose: null, where: 'device' },
  { field: 'crashReport', collected: true, purpose: 'analytics', where: 'sent' },
];
