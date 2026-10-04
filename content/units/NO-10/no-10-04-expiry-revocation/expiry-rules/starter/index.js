// Runs your cases against your isSessionValid, then revokes u-01's sessions after a
// password change made from session s-phone.
import { cases } from './expiry-cases.js';
import { isSessionValid, revokeUserSessions, sessions } from './sessions.js';

for (const { name, session, now, valid } of cases) {
  const actual = isSessionValid(session, now);
  console.log(`${actual === valid ? '✔' : '✖'} ${name}: ${actual}`);
}

sessions.set('s-laptop', { userId: 'u-01', createdAt: 0, lastSeenAt: 0 });
sessions.set('s-phone', { userId: 'u-01', createdAt: 0, lastSeenAt: 0 });
sessions.set('s-other', { userId: 'u-02', createdAt: 0, lastSeenAt: 0 });
const removed = revokeUserSessions('u-01', { except: 's-phone' });
console.log(`%%revoked%%: ${removed}; %%left%%: ${[...sessions.keys()].join(', ')}`);
