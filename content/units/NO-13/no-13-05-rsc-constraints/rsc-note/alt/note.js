// What moving the wishlist page to React Server Components would take.
import { canCross } from './crossing.js';
import { wishTree } from './tree.js';

// Lists every prop that a server component passes to a client child and that cannot cross,
// as "Parent → Child.prop", walking the whole tree in order.
export function blockedProps(tree) {
  return tree.children.flatMap((child) => {
    const crossing = tree.kind === 'server' && child.kind === 'client';
    const here = crossing
      ? Object.keys(child.props).filter((prop) => !canCross(child.props[prop])).map((prop) => `${tree.name} → ${child.name}.${prop}`)
      : [];
    return [...here, ...blockedProps(child)];
  });
}

const blockers = blockedProps(wishTree);

export const rscNote = {
  requires: ['pinned-react', 'rsc-runtime', 'bundler-split'],
  gains: ['less-to-hydrate', 'server-code-out-of-bundle'],
  blockers,
};
