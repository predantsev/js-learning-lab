// Your review of the offline sync PR. See the task for every rule.

// Review comments: { file, line, kind, severity, text }
//   kind: 'correctness' | 'security' | 'operability'; severity: 'blocking' | 'suggestion'
export const comments = [
  { file: 'sync.js', line: 21, kind: 'correctness', severity: 'blocking', text: `%%cClock%%` },
  { file: 'sync.js', line: 37, kind: 'security', severity: 'blocking', text: `%%cLimit%%` },
  { file: 'sync.js', line: 22, kind: 'security', severity: 'blocking', text: `%%cFields%%` },
  { file: 'sync.js', line: 6, kind: 'correctness', severity: 'suggestion', text: `%%cSeen%%` },
];

// The decision record for the sync strategy. Option ids come from strategies.js.
export const decision = {
  context: `%%dContext%%`,
  options: [
    { strategy: 'client-clock-last-write-wins', consequences: `%%dClientClock%%` },
    { strategy: 'server-time-last-write-wins', consequences: `%%dServerTime%%` },
    { strategy: 'server-version-check', consequences: `%%dVersion%%` },
  ],
  choice: 'server-version-check',
  consequences: `%%dConsequences%%`,
};

// The runbook section "Switch offline sync off". Step kinds: 'check' | 'data-check' | 'action' | 'confirm'
export const runbook = {
  signal: `%%rbSignal%%`,
  steps: [
    { kind: 'check', text: `%%rbCheck%%` },
    { kind: 'data-check', text: `%%rbData%%` },
    { kind: 'action', text: `%%rbAction%%` },
    { kind: 'confirm', text: `%%rbConfirm%%` },
  ],
};
