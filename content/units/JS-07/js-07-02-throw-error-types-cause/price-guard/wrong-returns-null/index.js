// Returns null for a bad price: the caller gets no error and may carry on with null.
function assertValidPrice(value) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return null;
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));
