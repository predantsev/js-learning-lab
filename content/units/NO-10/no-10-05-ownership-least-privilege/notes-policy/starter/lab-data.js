// Synthetic users and notes (read-only). `readers` lists users the owner shared a note with.
export const users = [
  { id: 'u-01', role: 'member' },
  { id: 'u-02', role: 'member' },
  { id: 'u-03', role: 'member' },
  { id: 'u-admin', role: 'admin' },
];

export const labCredentials = new Map([
  ['lab-token-u01', 'u-01'],
  ['lab-token-u02', 'u-02'],
  ['lab-token-u03', 'u-03'],
  ['lab-token-admin', 'u-admin'],
]);

export const seedNotes = [
  { id: 'n-1', ownerId: 'u-01', readers: ['u-02'], title: '%%gifts%%' },
  { id: 'n-2', ownerId: 'u-02', readers: [], title: '%%shopping%%' },
  { id: 'n-3', ownerId: 'u-01', readers: [], title: '%%diary%%' },
  { id: 'n-4', ownerId: 'u-03', readers: [], title: '%%trip%%' },
];
