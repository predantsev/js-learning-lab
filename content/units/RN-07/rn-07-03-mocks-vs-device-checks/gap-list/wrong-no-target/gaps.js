import { declaredTarget } from './claims.js';

// The right claims and checks, but the target is a vague word instead of the declared target.
export const gaps = [
  { claim: 'c4', check: "%%s4check%%", target: 'phone', expected: "%%s4expected%%" },
  { claim: 'c5', check: "%%s5check%%", target: 'phone', expected: "%%s5expected%%" },
  { claim: 'c6', check: "%%s6check%%", target: 'phone', expected: "%%s6expected%%" },
  { claim: 'c7', check: "%%s7check%%", target: declaredTarget, expected: "%%s7expected%%" },
];
