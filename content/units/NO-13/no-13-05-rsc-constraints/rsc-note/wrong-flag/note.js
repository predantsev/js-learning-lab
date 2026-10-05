// What moving the wishlist page to React Server Components would take.
import { canCross } from './crossing.js';
import { wishTree } from './tree.js';

// Lists every prop that a server component passes to a client child and that cannot cross,
// as "Parent → Child.prop", walking the whole tree in order.
export function blockedProps(tree) {
  const found = [];
  for (const child of tree.children) {
    if (tree.kind === 'server' && child.kind === 'client') {
      for (const [prop, value] of Object.entries(child.props)) {
        if (!canCross(value)) found.push(`${tree.name} → ${child.name}.${prop}`);
      }
    }
    found.push(...blockedProps(child));
  }
  return found;
}

export const rscNote = {
  requires: ['bundler-split', 'react-flag'],
  gains: ['server-code-out-of-bundle', 'less-to-hydrate'],
  blockers: blockedProps(wishTree),
};
