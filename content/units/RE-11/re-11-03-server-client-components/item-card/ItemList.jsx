import { useState } from "react";
import ItemCard from "./ItemCard";
import { saveAcquired } from "./api";

// We would like this to be a Server Component: it only lays out data.
// But it keeps state and creates a function for every card, so it cannot be one.
export default function ItemList({ items }) {
  const [list, setList] = useState(items);

  function toggle(id) {
    const item = list.find((entry) => entry.id === id);
    saveAcquired(id, !item.acquired);
    setList(list.map((entry) => (entry.id === id ? { ...entry, acquired: !entry.acquired } : entry)));
  }

  return (
    <ul>
      {list.map((item) => (
        <ItemCard key={item.id} item={item} onToggle={() => toggle(item.id)} />
      ))}
    </ul>
  );
}
