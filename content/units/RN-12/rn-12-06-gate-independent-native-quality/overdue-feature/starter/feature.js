// feature.js (read-only): what your tests import. It passes everything on to overdue.js and
// OverdueBadge.jsx; the course checks use it to run your tests against other versions of the rule.
import { overdueOn as yours } from './overdue.js';

export { OverdueBadge } from './OverdueBadge.jsx';

let other = null;
export function overdueOn(list, day) {
  return (other ?? yours)(list, day);
}

// For the course checks only.
export function useImplementation(rule = null) {
  other = rule;
}
