// The shared domain formatter (read-only): the same function the web client uses.
export function formatPrice(price) {
  return price === null ? '%%noPrice%%' : `${price} ₴`;
}
