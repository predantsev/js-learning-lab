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

// maxDepth is passed along unchanged and never checked, so the limit does nothing.
function depthOf(box, maxDepth) {
  if (box === null) {
    return 0;
  }
  return 1 + depthOf(box.inner, maxDepth);
}

console.log(depthOf(gift, 10)); // 3
console.log(depthOf(gift, 2)); // 2
console.log(depthOf(null, 10)); // 0
