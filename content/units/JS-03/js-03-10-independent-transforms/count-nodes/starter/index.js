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

// countNodes(node, maxDepth) counts the nodes on the first maxDepth levels (the root is level 1).
function countNodes(node, maxDepth) {
  return 0;
}

console.log(countNodes(spending, 10)); // 6
console.log(countNodes(spending, 2)); // 3
console.log(countNodes(null, 5)); // 0
