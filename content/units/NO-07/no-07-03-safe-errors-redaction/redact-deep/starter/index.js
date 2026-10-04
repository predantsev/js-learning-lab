// Prints a synthetic expenses-API config and a failure with a cause, after redaction (read-only).
import { redact } from './redact.js';

const KEYS = ['token', 'password', 'authorization', 'apiToken'];

const config = {
  port: 4310,
  database: { file: 'data/expenses.db', password: 'demo-db-pass' },
  backups: [{ target: 'backups/', token: 'demo-backup-token' }],
  Authorization: 'Bearer demo-admin',
};
console.log(JSON.stringify(redact(config, { keys: KEYS }), null, 2));

const failure = new Error('%%syncFailed%%', { cause: { target: 'backups/', apiToken: 'demo-sync-token' } });
console.log(JSON.stringify(redact(failure, { keys: KEYS })));
