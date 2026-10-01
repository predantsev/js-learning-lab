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

// No base case for null: after the smallest box it reads null.inner and throws a TypeError.
function depthOf(box, maxDepth) {
  if (maxDepth === 0) {
    return 0;
  }
  return 1 + depthOf(box.inner, maxDepth - 1);
}

console.log(depthOf(gift, 10)); // 3
console.log(depthOf(gift, 2)); // 2
console.log(depthOf(null, 10)); // 0
