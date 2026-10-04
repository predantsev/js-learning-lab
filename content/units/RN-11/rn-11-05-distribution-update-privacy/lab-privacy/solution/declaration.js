// The privacy declaration of the "note with photo" lab: one line per field of data-flow.js.
// Collected = it leaves the phone, also when a third-party library sends it.
export const declaration = [
  { field: 'noteText', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'photo', collected: true, purpose: 'app-functionality', where: 'sent' },
  { field: 'photoLocation', collected: false, purpose: null, where: 'none' },
  { field: 'themePreference', collected: false, purpose: null, where: 'device' },
  { field: 'crashReport', collected: true, purpose: 'analytics', where: 'sent' },
];
