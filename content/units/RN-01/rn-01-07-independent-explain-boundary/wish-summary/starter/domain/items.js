// Shared domain code of the wishlist: plain data in, plain data out.
export function summarizeItems(items) {
  const wanted = items.filter((item) => !item.acquired);
  const priced = wanted.filter((item) => item.price !== null);
  return {
    count: items.length,
    wantedTotal: priced.reduce((total, item) => total + item.price, 0),
    wantedWithoutPrice: wanted.length - priced.length,
  };
}
