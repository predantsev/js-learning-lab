export function ItemCard({ item, currency }) {
  const unit = currency ?? "%%currency%%";
  return <p>%%price%%: {item.price === null ? "%%noPrice%%" : `${item.price} ${unit}`}</p>;
}
