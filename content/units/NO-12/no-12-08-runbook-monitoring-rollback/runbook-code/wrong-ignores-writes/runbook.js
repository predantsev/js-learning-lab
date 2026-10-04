// The runbook entry "error rate above 5 % for 2 minutes", as code that can be tested.

export function alertFires(windows, { rate = 0.05, forWindows = 2, minRequests = 20 } = {}) {
  let streak = 0;
  for (const [i, { requests, errors }] of windows.entries()) {
    const bad = requests >= minRequests && errors / requests > rate;
    streak = bad ? streak + 1 : 0;
    if (streak === forWindows) return i;
  }
  return -1;
}

export function rollbackPlan({ current, previous, dataSchemaVersion, backup, writesSinceUpgrade }) {
  if (!previous) return { action: 'fix-forward', reason: 'no previous artifact is kept' };
  const steps = [`stop ${current.version}`, `verify sha256 ${previous.sha256}`];
  if (dataSchemaVersion > previous.supportsSchema) {
    if (!backup || backup.schemaVersion > previous.supportsSchema) {
      return { action: 'fix-forward', reason: `data schema ${dataSchemaVersion} is newer than ${previous.version} reads, and there is no older backup` };
    }
    steps.push(`restore ${backup.file}`);
  }
  steps.push(`start ${previous.version}`, 'check /readyz', 'check error rate');
  return { action: 'rollback', steps };
}
