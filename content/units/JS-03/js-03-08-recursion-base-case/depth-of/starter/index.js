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
  return 0;
}

console.log(depthOf(gift, 10)); // 3
console.log(depthOf(gift, 2)); // 2
console.log(depthOf(null, 10)); // 0
