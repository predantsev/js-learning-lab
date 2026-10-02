// assertValidPrice(value) returns a valid price unchanged and throws for anything else.
function assertValidPrice(value) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError("price must be a number, got " + value);
  }
  if (value < 0) {
    throw new RangeError("price must be at least 0, got " + value);
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));

// Remove // from ONE of these lines at a time to see the error it throws.
// Put the // back before you press Check: an uncaught error stops the whole file.
// assertValidPrice("80");
// assertValidPrice(-5);
