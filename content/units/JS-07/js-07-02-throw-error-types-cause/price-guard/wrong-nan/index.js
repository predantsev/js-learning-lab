// typeof NaN is "number", so NaN slips through as a "valid" price.
function assertValidPrice(value) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "number") {
    throw new TypeError("price must be a number, got " + value);
  }
  if (value < 0) {
    throw new RangeError("price must be at least 0, got " + value);
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));
