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

// Checks the children before recursing, so it never calls itself with null.
const countNodes = (node, maxDepth) => {
  if (node === null || maxDepth <= 0) {
    return 0;
  }
  let count = 1;
  if (node.left !== null) {
    count = count + countNodes(node.left, maxDepth - 1);
  }
  if (node.right !== null) {
    count = count + countNodes(node.right, maxDepth - 1);
  }
  return count;
};

console.log(countNodes(spending, 10)); // 6
console.log(countNodes(spending, 2)); // 3
console.log(countNodes(null, 5)); // 0
