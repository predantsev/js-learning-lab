// What moving the wishlist page to React Server Components would take.
import { canCross } from './crossing.js';
import { wishTree } from './tree.js';

// Lists every prop that a server component passes to a client child and that cannot cross,
// as "Parent → Child.prop", walking the whole tree in order.
export function blockedProps(tree) {
  return [];
}

export const rscNote = {
  requires: [],
  gains: [],
  blockers: [],
};
