import { useState } from "react";
import type { ChangeEvent } from "react";
import { WISHES } from "./wishes";
import type { Wish } from "./wishes";

// A custom hook with a typed result: a tuple of the current value and a function that flips it.
function useToggle(initial: boolean): [boolean, () => void] {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((value) => !value);
  return [on, toggle];
}

type WishRowProps = { wish: Wish; currency?: string };

function WishRow({ wish, currency }: WishRowProps) {
  // `currency` is optional: narrow it before use, here with a default.
  const unit = currency ?? "%%uah%%";
  const price = wish.price === null ? "%%noPrice%%" : `${wish.price} ${unit}`;
  return (
    <li>
      {wish.name} — {price}
    </li>
  );
}

export default function WishFilters() {
  const [query, setQuery] = useState("");
  const [acquiredOnly, toggleAcquiredOnly] = useToggle(false);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  const needle = query.trim().toLowerCase();
  const visible = WISHES.filter((wish) => (!acquiredOnly || wish.acquired) && wish.name.toLowerCase().includes(needle));
  console.log("render:", { query, acquiredOnly, shown: visible.length });

  return (
    <section>
      <h2>%%heading%%</h2>
      <label>
        %%search%% <input value={query} onChange={handleQueryChange} />
      </label>{" "}
      <button aria-pressed={acquiredOnly} onClick={toggleAcquiredOnly}>
        %%acquiredOnly%%
      </button>
      <ul>
        {visible.map((wish) => (
          <WishRow key={wish.id} wish={wish} />
        ))}
      </ul>
    </section>
  );
}
