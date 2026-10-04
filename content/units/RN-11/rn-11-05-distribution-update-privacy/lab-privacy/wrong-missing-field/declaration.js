// Fields that are "not collected" were simply left out — the declaration no longer covers the data flow.
export const declaration = [
  { field: 'noteText', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'photo', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'crashReport', collected: true, purpose: 'analytics', where: 'sent' },
];
