// A gift packed in boxes: every box has a label and an inner box (null = nothing inside).
const gift = {
  label: "%%big%%",
  inner: {
    label: "%%middle%%",
    inner: {
      label: "%%small%%",
      inner: null,
    },
  },
};

// depthOf(box, maxDepth) returns how many boxes are nested, counting box itself,
// but never more than maxDepth. depthOf(null, maxDepth) is 0.
function depthOf(box, maxDepth) {
  if (box === null) {
    return 0; // base case: no box at all
  }
  if (maxDepth === 0) {
    return 0; // base case: no depth left
  }
  return 1 + depthOf(box.inner, maxDepth - 1); // this box plus what is inside
}

console.log(depthOf(gift, 10)); // 3
console.log(depthOf(gift, 2)); // 2
console.log(depthOf(null, 10)); // 0
