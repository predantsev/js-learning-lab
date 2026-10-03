import { declaredTarget } from './claims.js';

// Lists everything as a device check, including what the mocked tests already prove.
export const gaps = [
  { claim: 'c2', check: "%%s4check%%", target: declaredTarget, expected: "%%s4expected%%" },
  { claim: 'c4', check: "%%s4check%%", target: declaredTarget, expected: "%%s4expected%%" },
  { claim: 'c5', check: "%%s5check%%", target: declaredTarget, expected: "%%s5expected%%" },
  { claim: 'c6', check: "%%s6check%%", target: declaredTarget, expected: "%%s6expected%%" },
  { claim: 'c7', check: "%%s7check%%", target: declaredTarget, expected: "%%s7expected%%" },
];
