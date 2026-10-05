// Synthetic users and notes of the lab notes service (read-only).
export const WEB_CLIENT = 'http://127.0.0.1:4310';
export const PASSWORDS = new Map([['u-01', 'sunflower-42'], ['u-02', 'river-stone-7']]); // lab only
export const ABSOLUTE_MS = 120 * 60_000; // a session lives at most 2 hours

export const seedNotes = [
  { id: 'n-1', ownerId: 'u-01', title: '%%gifts%%' },
  { id: 'n-2', ownerId: 'u-02', title: '%%shopping%%' },
  { id: 'n-3', ownerId: 'u-01', title: '%%diary%%' },
];
