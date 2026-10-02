// true only for a number you can safely calculate with:
// of type "number", not NaN, not Infinity and not -Infinity.
function isUsableNumber(x) {
  return Number.isFinite(x);
}

console.log(isUsableNumber(45), isUsableNumber(0 / 0), isUsableNumber(1 / 0), isUsableNumber("45"));
