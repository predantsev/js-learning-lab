import { test, expect } from './testing.js';
import { loadSyncSession } from './syncSession.js';
import { secureStoreMock } from './secureStoreMock.js';

test('%%tLoads%%', async () => {
  const session = await loadSyncSession(secureStoreMock);
  expect(session).toEqual({ status: 'on', token: 'demo-sync-token' });
});
