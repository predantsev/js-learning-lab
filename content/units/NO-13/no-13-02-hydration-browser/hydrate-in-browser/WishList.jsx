import { useState } from "react";

// The same component the server rendered: same markup for the same props.
export default function WishList({ items }) {
  const [acquired, setAcquired] = useState(() => items.filter((item) => item.acquired).map((item) => item.id));
  function toggle(id) {
    setAcquired(acquired.includes(id) ? acquired.filter((x) => x !== id) : [...acquired, id]);
  }
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name}{" "}
          <button type="button" aria-pressed={acquired.includes(item.id)} onClick={() => toggle(item.id)}>
            {acquired.includes(item.id) ? "%%gotIt%%" : "%%wanted%%"}
          </button>
        </li>
      ))}
    </ul>
  );
}
