// The coverage matrix of the habit tracker. Cell values:
// 'verified' — checked there, with a record; 'evidence' — supplied evidence from someone else's
// run, not your own; 'unperformed' — not checked there yet; 'n/a' — that place cannot check it.
export const columns = ['host', 'target', 'other'];

export const features = [
  { id: 'streak', name: '%%fStreak%%', host: 'verified', target: 'verified', other: 'unperformed' },
  { id: 'done-button', name: '%%fButton%%', host: 'verified', target: 'verified', other: 'evidence' },
  { id: 'restart', name: '%%fRestart%%', host: 'n/a', target: 'verified', other: 'unperformed' },
  { id: 'reduced-motion', name: '%%fMotion%%', host: 'n/a', target: 'unperformed', other: 'unperformed' },
];
