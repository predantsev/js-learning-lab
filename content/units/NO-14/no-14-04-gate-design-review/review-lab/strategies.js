// Sync strategies the team listed in the PR thread (read-only). Use these ids in your decision record.
export const strategies = {
  'client-clock-last-write-wins': 'The change with the later editedAt (the device clock) replaces the task.',
  'server-time-last-write-wins': 'The change that reaches the server last replaces the task.',
  'field-merge': 'Fields changed by different devices are merged; the later change of the same field wins.',
  'server-version-check': 'A change applies only if its baseVersion equals the task version; otherwise it is a conflict.',
};
