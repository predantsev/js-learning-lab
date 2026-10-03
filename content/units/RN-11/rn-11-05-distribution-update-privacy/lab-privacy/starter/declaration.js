// The privacy declaration of the "note with photo" lab: one line per field of data-flow.js.
// Each line: { field, collected: true | false, purpose: one of PURPOSES or null, where: 'sent' | 'device' | 'none' }
export const declaration = [
  { field: 'noteText', collected: false, purpose: null, where: 'device' },
];
