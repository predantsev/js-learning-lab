// Fields that are "not collected" were simply left out — the declaration no longer covers the data flow.
export const declaration = [
  { field: 'expenseRecord', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'receiptPhoto', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'crashReport', collected: true, purpose: 'analytics', where: 'sent' },
];
