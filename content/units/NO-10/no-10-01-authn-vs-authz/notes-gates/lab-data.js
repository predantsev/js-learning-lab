// Synthetic users and notes of the lab notes service. Nothing here is a real account.
export const users = [
  { id: 'u-01', name: '%%marta%%', role: 'member' },
  { id: 'u-02', name: '%%bohdan%%', role: 'member' },
  { id: 'u-admin', name: '%%admin%%', role: 'admin' },
];

// Lab credentials: a fixed token per synthetic user, sent as "Authorization: Bearer <token>".
// A real server issues credentials after a login — that is lesson 3 of this unit.
export const labCredentials = new Map([
  ['lab-token-u01', 'u-01'],
  ['lab-token-u02', 'u-02'],
  ['lab-token-admin', 'u-admin'],
]);

export const seedNotes = [
  { id: 'n-1', ownerId: 'u-01', title: '%%gifts%%' },
  { id: 'n-2', ownerId: 'u-02', title: '%%shopping%%' },
  { id: 'n-3', ownerId: 'u-01', title: '%%trip%%' },
];
