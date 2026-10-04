// The runbook entry "error rate above 5 % for 2 minutes", as code that can be tested.
// This version checks every run of `forWindows` windows with slice + every.

export function alertFires(windows, { rate = 0.05, forWindows = 2, minRequests = 20 } = {}) {
  const isBad = (w) => w.requests >= minRequests && w.errors > rate * w.requests;
  return windows.findIndex((_, end) => end + 1 >= forWindows && windows.slice(end + 1 - forWindows, end + 1).every(isBad));
}

export function rollbackPlan({ current, previous, dataSchemaVersion, backup, writesSinceUpgrade }) {
  if (previous == null) return { action: 'fix-forward', reason: 'nothing to roll back to' };
  const needsRestore = dataSchemaVersion > previous.supportsSchema;
  const canRestore = backup != null && backup.schemaVersion <= previous.supportsSchema && writesSinceUpgrade === 0;
  if (needsRestore && !canRestore) return { action: 'fix-forward', reason: 'the previous release cannot read the data safely' };
  return {
    action: 'rollback',
    steps: [
      `stop ${current.version}`,
      `verify sha256 ${previous.sha256}`,
      ...(needsRestore ? [`restore ${backup.file}`] : []),
      `start ${previous.version}`,
      'check /readyz',
      'check error rate',
    ],
  };
}
