import { useState } from "react";
import { wishes } from "./wishes.js";

const FILTERS = [
  { id: "all", label: "%%all%%" },
  { id: "wanted", label: "%%wanted%%" },
  { id: "acquired", label: "%%acquired%%" },
];

// A list of wishes with its own status filter. Read-only.
// It calls onSelect(id) when a wish is clicked.
export default function WishPicker({ selectedId, onSelect }) {
  const [status, setStatus] = useState("all");
  const shown = wishes.filter((wish) => status === "all" || wish.acquired === (status === "acquired"));

  return (
    <nav>
      <div className="filter">
        {FILTERS.map((filter) => (
          <button key={filter.id} aria-pressed={status === filter.id} onClick={() => setStatus(filter.id)}>
            {filter.label}
          </button>
        ))}
      </div>
      <ul className="picker">
        {shown.map((wish) => (
          <li key={wish.id}>
            <button aria-current={wish.id === selectedId} onClick={() => onSelect(wish.id)}>
              {wish.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
