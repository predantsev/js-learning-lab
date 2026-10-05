// Copied from an older project.
export function ItemCard({ item, currency }) {
  return <p>%%price%%: {item.price === null ? "%%noPrice%%" : `${item.price} ${currency}`}</p>;
}

ItemCard.defaultProps = { currency: "%%currency%%" };
