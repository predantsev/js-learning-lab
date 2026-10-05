import { useState } from "react";

const WISHES = [
  { id: "w-02", name: "%%lamp%%" },
  { id: "w-06", name: "%%mug%%" },
];

export default function WishList() {
  const [wishes, setWishes] = useState(WISHES);

  let priceToggle = null;
  if (wishes.length > 0) {
    // A hook inside a condition: called on some renders and skipped on others.
    const [showPrices, setShowPrices] = useState(false);
    priceToggle = (
      <label>
        <input type="checkbox" checked={showPrices} onChange={(event) => setShowPrices(event.target.checked)} />
        {showPrices ? " %%pricesShown%%" : " %%pricesHidden%%"}
      </label>
    );
  }

  const [note] = useState("%%note%%");
  console.log(`render: ${wishes.length} wishes, note = ${note}`);

  return (
    <section>
      <h2>%%heading%%</h2>
      <p>{note}</p>
      {priceToggle}
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>{wish.name}</li>
        ))}
      </ul>
      <button onClick={() => setWishes(wishes.slice(1))}>%%removeFirst%%</button>
    </section>
  );
}
