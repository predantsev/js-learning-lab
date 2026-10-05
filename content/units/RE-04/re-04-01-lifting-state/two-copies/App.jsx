import { useState } from "react";
import { WISHES } from "./wishes.js";

function WishList() {
  // Copy 1 of the wishes: only this component can change it.
  const [wishes, setWishes] = useState(WISHES);

  function toggle(id) {
    setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, acquired: !wish.acquired } : wish)));
  }

  return (
    <ul>
      {wishes.map((wish) => (
        <li key={wish.id}>
          <label>
            <input type="checkbox" checked={wish.acquired} onChange={() => toggle(wish.id)} /> {wish.name}
          </label>
        </li>
      ))}
    </ul>
  );
}

function Summary() {
  // Copy 2 of the wishes: it never hears about the clicks in WishList.
  const [wishes] = useState(WISHES);
  const acquired = wishes.filter((wish) => wish.acquired).length;
  return (
    <p>
      %%bought%% {acquired} %%of%% {wishes.length}
    </p>
  );
}

export default function WishPage() {
  return (
    <section>
      <h2>%%heading%%</h2>
      <WishList />
      <Summary />
    </section>
  );
}
