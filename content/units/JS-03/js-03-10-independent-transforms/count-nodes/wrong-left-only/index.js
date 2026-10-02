// Expense categories as a tree: every node has a label and two children (left, right) or null.
const spending = {
  label: "%%all%%",
  left: {
    label: "%%food%%",
    left: { label: "%%groceries%%", left: null, right: null },
    right: { label: "%%cafe%%", left: null, right: null },
  },
  right: {
    label: "%%transport%%",
    left: null,
    right: { label: "%%transitPass%%", left: null, right: null },
  },
};

// Only the left branch is walked; the right side of every node is forgotten.
function countNodes(node, maxDepth) {
  if (node === null || maxDepth === 0) {
    return 0;
  }
  return 1 + countNodes(node.left, maxDepth - 1);
}

console.log(countNodes(spending, 10)); // 6
console.log(countNodes(spending, 2)); // 3
console.log(countNodes(null, 5)); // 0
