// index.js: a small demo of your secret store next to the records storage. Do not edit.
import { createMemorySecretStore } from './secretStore.ts';

const records = new Map(); // the records storage stands apart: plain text, no secrets
const recordsStorage = {
  async getItem(key) { return records.has(key) ? records.get(key) : null; },
  async setItem(key, value) { records.set(key, value); },
};

const secrets = createMemorySecretStore();

try {
  console.log('set token:', JSON.stringify(await secrets.setSecret('session.token', 'tok_demo_51b2')));
  console.log('get token:', JSON.stringify(await secrets.getSecret('session.token')));
  console.log('bad key:', JSON.stringify(await secrets.setSecret('session token', 'x')));
  console.log('too large:', JSON.stringify(await secrets.setSecret('session.token', 'x'.repeat(2049))));
  console.log('deleted:', JSON.stringify(await secrets.deleteSecret('session.token')));
  console.log('after delete:', JSON.stringify(await secrets.getSecret('session.token')));
  console.log('unavailable:', JSON.stringify(await createMemorySecretStore({ available: false }).getSecret('session.token')));

  await recordsStorage.setItem('jsll.habits.v1', JSON.stringify({ schemaVersion: 1, records: [] }));
  console.log('records keys:', JSON.stringify([...records.keys()]));
} catch (error) {
  console.log('demo stopped:', error.message);
}
