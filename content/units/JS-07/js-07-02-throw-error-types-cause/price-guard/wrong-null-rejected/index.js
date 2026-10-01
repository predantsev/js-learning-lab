// typeof null is "object", so "no price yet" is rejected as if it were a wrong type.
function assertValidPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError("price must be a number, got " + value);
  }
  if (value < 0) {
    throw new RangeError("price must be at least 0, got " + value);
  }
  return value;
}

console.log(assertValidPrice(45));
