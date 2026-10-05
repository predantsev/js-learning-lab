export default function ItemCard(props) {
  // What crosses into the card: the kind of every prop.
  console.log(`ItemCard ${props.item.id}: ${Object.entries(props).map(([key, value]) => `${key}: ${typeof value}`).join(", ")}`);

  const { item, onToggle } = props;
  return (
    <li>
      {`${item.name} — €${item.price}`}{" "}
      <button onClick={onToggle}>{item.acquired ? "%%acquired%%" : "%%wanted%%"}</button>
    </li>
  );
}
