// Throws plain text instead of error objects: no type to tell the problems apart, no stack trace.
function assertValidPrice(value) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw "price must be a number, got " + value;
  }
  if (value < 0) {
    throw "price must be at least 0, got " + value;
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));
