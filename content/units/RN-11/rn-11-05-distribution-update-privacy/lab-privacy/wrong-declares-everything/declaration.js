// "Declare everything to be safe": the theme stays on the phone, and the location is never kept.
export const declaration = [
  { field: 'expenseRecord', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'receiptPhoto', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'photoLocation', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'themePreference', collected: true, purpose: 'personalization', where: 'device' },
  { field: 'crashReport', collected: true, purpose: 'analytics', where: 'sent' },
];
