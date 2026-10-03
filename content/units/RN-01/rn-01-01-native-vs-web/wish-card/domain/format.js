// Shared domain code: plain data in, plain text out. No DOM, no React, no platform.
export function formatWish(wish, labels) {
  const price = wish.price === null ? labels.noPrice : `${wish.price} ${labels.currency}`;
  return `${wish.name} — ${price}`;
}
