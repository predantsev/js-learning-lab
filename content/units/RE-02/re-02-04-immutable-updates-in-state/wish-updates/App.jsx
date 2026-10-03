import { useState } from "react";

const startWishes = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
];
let nextNumber = 3;

function newWish() {
  const id = "w-0" + nextNumber;
  nextNumber += 1;
  return { id, name: "%%mug%% " + id, price: 18, acquired: false };
}

export default function WishList() {
  const [wishes, setWishes] = useState(startWishes);
  const [refreshes, setRefreshes] = useState(0);
  console.log("render: wishes =", wishes.length, "refreshes =", refreshes);

  function handleAddPush() {
    wishes.push(newWish());
    setWishes(wishes);
  }

  function handleAddSpread() {
    setWishes([...wishes, newWish()]);
  }

  function handleToggle(id) {
    const wish = wishes.find((w) => w.id === id);
    wish.acquired = !wish.acquired;
    setWishes(wishes);
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <button onClick={handleAddPush}>%%addPush%%</button>{" "}
      <button onClick={handleAddSpread}>%%addSpread%%</button>{" "}
      <button onClick={() => setRefreshes((r) => r + 1)}>%%refresh%%</button>
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>
            {wish.name} — {wish.acquired ? "%%acquired%%" : "%%wanted%%"}{" "}
            <button onClick={() => handleToggle(wish.id)}>%%toggle%%</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
