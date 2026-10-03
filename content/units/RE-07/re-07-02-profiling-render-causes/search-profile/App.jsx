import { useState } from "react";
import { WISHES } from "./wishes";
import { Measure, countRender } from "./profile";

function SearchField({ value, onChange }) {
  countRender("SearchField");
  return (
    <label>
      %%search%% <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function WishCard({ wish }) {
  countRender("WishCard");
  const price = new Intl.NumberFormat("%%locale%%", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(wish.price);
  return (
    <li>
      {wish.name} — {price}
    </li>
  );
}

function WishList({ wishes }) {
  countRender("WishList");
  return (
    <ul>
      {wishes.map((wish) => (
        <WishCard key={wish.id} wish={wish} />
      ))}
    </ul>
  );
}

function Summary({ count }) {
  countRender("Summary");
  return (
    <p>
      %%shown%% {count}
    </p>
  );
}

export default function WishPage() {
  countRender("WishPage");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const visible = WISHES.filter((wish) => wish.name.toLowerCase().includes(query.toLowerCase()));

  function search(event) {
    event.preventDefault();
    setQuery(draft.trim());
  }

  return (
    <Measure id="WishPage">
      <form onSubmit={search}>
        <SearchField value={draft} onChange={setDraft} /> <button type="submit">%%find%%</button>
      </form>
      <Summary count={visible.length} />
      <WishList wishes={visible} />
    </Measure>
  );
}
