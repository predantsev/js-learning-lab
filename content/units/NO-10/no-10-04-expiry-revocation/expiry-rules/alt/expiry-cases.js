// Cases built around one login at minute 0.
import { min } from './time.js';

const at = (lastSeen, now, valid, name) => ({ name, session: { createdAt: 0, lastSeenAt: min(lastSeen) }, now, valid });

export const cases = [
  at(0, min(29), true, 'idle 29 min'),
  at(0, min(30), true, 'idle 30 min'),
  at(0, min(30) + 1, false, 'idle just over 30 min'),
  at(100, min(110), true, 'active after 110 min'),
  at(119, min(120), true, 'age 120 min'),
  at(119, min(121), false, 'age 121 min'),
];
