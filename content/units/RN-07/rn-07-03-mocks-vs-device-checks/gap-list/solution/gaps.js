import { declaredTarget } from './claims.js';

// One entry per claim that the mocked tests cannot prove:
// { claim: 'c…', check: 'what you do on the target', target: declaredTarget, expected: 'what you should observe' }
export const gaps = [
  { claim: 'c4', check: "%%s4check%%", target: declaredTarget, expected: "%%s4expected%%" },
  { claim: 'c5', check: "%%s5check%%", target: declaredTarget, expected: "%%s5expected%%" },
  { claim: 'c6', check: "%%s6check%%", target: declaredTarget, expected: "%%s6expected%%" },
  { claim: 'c7', check: "%%s7check%%", target: declaredTarget, expected: "%%s7expected%%" },
];
