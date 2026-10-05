import { declaredTarget } from './claims.js';

// The same gaps in another order, written with a helper.
const onTarget = (claim, check, expected) => ({ claim, check, target: declaredTarget, expected });

export const gaps = [
  onTarget('c7', "%%s7check%%", "%%s7expected%%"),
  onTarget('c6', "%%s6check%%", "%%s6expected%%"),
  onTarget('c5', "%%s5check%%", "%%s5expected%%"),
  onTarget('c4', "%%s4check%%", "%%s4expected%%"),
];
