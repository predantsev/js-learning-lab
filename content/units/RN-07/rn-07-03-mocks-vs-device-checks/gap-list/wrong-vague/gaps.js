import { declaredTarget } from './claims.js';

// The right claims and target, but one gap says neither what to do nor what to observe.
export const gaps = [
  { claim: 'c4', check: 'restart', target: declaredTarget, expected: 'works' },
  { claim: 'c5', check: "%%s5check%%", target: declaredTarget, expected: "%%s5expected%%" },
  { claim: 'c6', check: "%%s6check%%", target: declaredTarget, expected: "%%s6expected%%" },
  { claim: 'c7', check: "%%s7check%%", target: declaredTarget, expected: "%%s7expected%%" },
];
