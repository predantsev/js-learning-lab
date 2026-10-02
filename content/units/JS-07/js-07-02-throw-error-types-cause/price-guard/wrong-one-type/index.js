// One general Error for every problem: the type no longer says what went wrong.
function assertValidPrice(value) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error("invalid price: " + value);
  }
  return value;
}

console.log(assertValidPrice(45));
console.log(assertValidPrice(null));
