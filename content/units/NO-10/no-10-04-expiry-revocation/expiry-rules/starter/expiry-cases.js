// Your test cases for isSessionValid, each with a fixed clock: no case reads the real time.
// min(n) turns minutes into milliseconds. A case: { name, session: { createdAt, lastSeenAt }, now, valid }.
import { min } from './time.js';

export const cases = [
  { name: 'a fresh session is valid', session: { createdAt: min(0), lastSeenAt: min(0) }, now: min(1), valid: true },
  // TODO: add a case for every boundary of the two rules
];
