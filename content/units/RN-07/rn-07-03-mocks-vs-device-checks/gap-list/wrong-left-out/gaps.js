import { declaredTarget } from './claims.js';

// Misconception: "what cannot be mocked cannot be checked, so it stays out of the plan".
export const gaps = [
  { claim: 'c4', check: "%%s4check%%", target: declaredTarget, expected: "%%s4expected%%" },
];
