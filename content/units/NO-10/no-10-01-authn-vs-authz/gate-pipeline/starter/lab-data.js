// Synthetic users and planner tasks (read-only). Nothing here is a real account.
export const users = [
  { id: 'u-01', name: '%%marta%%' },
  { id: 'u-02', name: '%%bohdan%%' },
];

// Lab credentials: a fixed token per synthetic user, sent as "Authorization: Bearer <token>".
export const labCredentials = new Map([
  ['lab-token-u01', 'u-01'],
  ['lab-token-u02', 'u-02'],
]);

export const seedTasks = [
  { id: 't-1', ownerId: 'u-01', title: '%%tickets%%', dueDate: '2026-03-04' },
  { id: 't-2', ownerId: 'u-02', title: '%%dentist%%', dueDate: '2026-03-06' },
];
