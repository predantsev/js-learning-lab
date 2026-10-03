export function ItemCard({ item, currency = "%%currency%%" }) {
  return <p>%%price%%: {item.price === null ? "%%noPrice%%" : `${item.price} ${currency}`}</p>;
}
