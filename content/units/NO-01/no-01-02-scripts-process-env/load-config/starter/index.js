// Read-only driver: calls loadConfig with three environments, as three terminal runs would.
import { loadConfig } from './config.js';

const environments = [
  { TODAY: '2026-03-01' },
  { PORT: '8080', LOCALE: 'en', TODAY: '2026-03-02' },
  { PORT: 'abc', TODAY: '2026-13-01' },
];
for (const env of environments) {
  const result = loadConfig(env);
  if (result.ok) console.log('%%okLabel%%', JSON.stringify(result.value));
  else console.error('%%errorLabel%%', JSON.stringify(result.errors));
}
