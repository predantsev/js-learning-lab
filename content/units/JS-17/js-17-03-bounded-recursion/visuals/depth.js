// A chain of four categories: every node has one child, the last has none.
const chain = { id: "c-1", children: [{ id: "c-2", children: [{ id: "c-3", children: [{ id: "c-4", children: [] }] }] }] };

// Recursive: one call frame per level.
function countNodes(node, depth) {
  let total = 1;
  for (const child of node.children) {
    total = total + countNodes(child, depth + 1);
  }
  return total;
}

// Explicit stack: the levels wait in an array, the call stack stays flat.
function countWithStack(root) {
  let total = 0;
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    total = total + 1;
    for (const child of node.children) {
      stack.push(child);
    }
  }
  return total;
}

const viaCalls = countNodes(chain, 1);
const viaStack = countWithStack(chain);
console.log(viaCalls, viaStack);
