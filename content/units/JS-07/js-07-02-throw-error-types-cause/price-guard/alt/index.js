// Another valid order: the negative check first, with null and the type checked separately.
function assertValidPrice(value) {
  if (typeof value === "number" && value < 0) {
    throw new RangeError("price must not be negative: " + value);
  }
  if (value !== null && (typeof value !== "number" || Number.isNaN(value))) {
    throw new TypeError("expected a number or null for the price, received " + typeof value + " " + value);
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));
