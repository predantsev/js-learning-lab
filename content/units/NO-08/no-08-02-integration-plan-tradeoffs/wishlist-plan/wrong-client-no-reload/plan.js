// The integration plan of the wishlist lab: one row per requirement, one decision record and
// the PR's title and summary. render.js turns all of it into the PR description.

export const plan = [
  {
    requirement: 'real-requests',
    component: 'api',
    steps: ['request', 'read-log'],
    evidence: '%%evRequests%%',
  },
  {
    requirement: 'invalid-input',
    component: 'api',
    steps: ['request', 'request', 'read-log'],
    evidence: '%%evInvalid%%',
  },
  {
    requirement: 'restart',
    component: 'repository',
    steps: ['request', 'stop-server', 'start-server', 'request'],
    evidence: '%%evRestart%%',
  },
  {
    requirement: 'client',
    component: 'client-adapter',
    steps: ['request', 'read-log'],
    evidence: '%%evClient%%',
  },
];

export const decision = {
  context: '%%decContext%%',
  options: [
    { id: 'write-through', failureMode: '%%fmThrough%%', losesAcknowledgedWrites: false },
    { id: 'cache-flush', failureMode: '%%fmCache%%', losesAcknowledgedWrites: true },
  ],
  choice: 'write-through',
  consequences: ['%%decCost%%'],
};

// A runbook note: what to do first when this symptom is reported.
export const runbook = {
  symptom: '%%rbSymptom%%',
  steps: ['request', 'read-log'],
};

export const pr = {
  title: '%%prTitle%%',
  summary: '%%prSummary%%',
};
