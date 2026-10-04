// Your review of the offline sync PR. See the task for every rule.

// Review comments: { file, line, kind, severity, text }
//   kind: 'correctness' | 'security' | 'operability'; severity: 'blocking' | 'suggestion'
export const comments = [];

// The decision record for the sync strategy. Option ids come from strategies.js.
export const decision = {
  context: '',
  options: [], // { strategy, consequences }
  choice: '',
  consequences: '',
};

// The runbook section "Switch offline sync off". Step kinds: 'check' | 'data-check' | 'action' | 'confirm'
export const runbook = {
  signal: '',
  steps: [], // { kind, text }
};
