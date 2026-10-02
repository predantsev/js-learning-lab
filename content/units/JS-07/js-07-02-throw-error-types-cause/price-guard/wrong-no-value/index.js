// The right types, but the messages do not say which value came in.
function assertValidPrice(value) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError("price must be a number");
  }
  if (value < 0) {
    throw new RangeError("price must not be negative");
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));
