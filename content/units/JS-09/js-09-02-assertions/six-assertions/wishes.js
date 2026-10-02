// Throws a RangeError unless the price is a number of 0 or more.
export function assertValidPrice(price) {
  if (typeof price !== "number" || price < 0) {
    throw new RangeError(`%%priceError%%: ${price}`);
  }
}
