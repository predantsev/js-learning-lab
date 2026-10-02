// Number.isFinite is false for NaN, Infinity and every non-number, without converting text.
function assertValidPrice(value) {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value)) {
    throw new TypeError("price must be a finite number, got " + value);
  }
  if (value < 0) {
    throw new RangeError("price must be at least 0, got " + value);
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));
