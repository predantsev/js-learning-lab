// A demo (read-only): the alert over six one-minute windows and the rollback plans of two incidents.
import { alertFires, rollbackPlan } from './runbook.js';

const windows = [
  { requests: 48, errors: 1 }, { requests: 51, errors: 4 }, { requests: 12, errors: 3 },
  { requests: 45, errors: 4 }, { requests: 50, errors: 6 }, { requests: 47, errors: 7 },
];
console.log('%%alertAt%%', alertFires(windows));

const current = { version: '2.4.0', sha256: '9c1e…' };
const previous = { version: '2.3.0', sha256: '41ab…', supportsSchema: 3 };
console.log(rollbackPlan({ current, previous, dataSchemaVersion: 4, backup: { file: 'backups/habits-before-2.4.0.json', schemaVersion: 3 }, writesSinceUpgrade: 0 }));
console.log(rollbackPlan({ current, previous, dataSchemaVersion: 4, backup: { file: 'backups/habits-before-2.4.0.json', schemaVersion: 3 }, writesSinceUpgrade: 57 }));
