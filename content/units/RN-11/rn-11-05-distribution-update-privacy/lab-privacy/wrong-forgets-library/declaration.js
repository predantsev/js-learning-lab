// Misconception: "only my own code collects data" — the crash library's report is left out.
export const declaration = [
  { field: 'noteText', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'photo', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'photoLocation', collected: false, purpose: null, where: 'none' },
  { field: 'themePreference', collected: false, purpose: null, where: 'device' },
  { field: 'crashReport', collected: false, purpose: null, where: 'device' },
];
