// The runbook entry "error rate above 5 % for 2 minutes", as code that can be tested.

export function alertFires(windows, { rate = 0.05, forWindows = 2, minRequests = 20 } = {}) {
  // TODO: the index of the window where the alert fires, or -1
  return -1;
}

export function rollbackPlan({ current, previous, dataSchemaVersion, backup, writesSinceUpgrade }) {
  // TODO: { action: 'rollback', steps } or { action: 'fix-forward', reason }
  return { action: 'fix-forward', reason: 'not written yet' };
}
