// Builds the short text shown for a wish in the list: its name and its price.
export function formatLabel(item) {
  const price = item.price === null ? "%%noPrice%%" : item.price;
  return `${item.name}: ${price}`;
}
