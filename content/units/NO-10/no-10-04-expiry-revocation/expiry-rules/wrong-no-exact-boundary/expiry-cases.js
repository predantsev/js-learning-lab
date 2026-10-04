// Your test cases for isSessionValid, each with a fixed clock: no case reads the real time.
// min(n) turns minutes into milliseconds. A case: { name, session: { createdAt, lastSeenAt }, now, valid }.
import { min } from './time.js';

export const cases = [
  { name: 'a fresh session is valid', session: { createdAt: min(0), lastSeenAt: min(0) }, now: min(1), valid: true },
  // idle: exactly 30 minutes is still valid, one millisecond more is not
  { name: 'idle 30 min + 1 ms', session: { createdAt: min(0), lastSeenAt: min(10) }, now: min(40) + 1, valid: false },
  // idle is counted from the last request, not from login
  { name: 'old login, recent request', session: { createdAt: min(0), lastSeenAt: min(90) }, now: min(100), valid: true },
  // absolute: exactly 2 hours is still valid, one millisecond more is not, however active
  { name: 'age 120 min + 1 ms', session: { createdAt: min(0), lastSeenAt: min(115) }, now: min(120) + 1, valid: false },
];
