import { useEffect, useState } from "react";
import { since } from "./clock";

// Pretend time the data request takes after the JavaScript has started it.
const DATA_MS = 400;

const ITEMS = [
  { id: "w-01", name: "%%headphones%%" },
  { id: "w-02", name: "%%lamp%%" },
  { id: "w-03", name: "%%bicycle%%" },
];

function loadItems() {
  return new Promise((resolve) => setTimeout(() => resolve(ITEMS), DATA_MS));
}

export default function App() {
  const [items, setItems] = useState(null);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    loadItems().then((list) => {
      console.log(`${since()} ms: %%dataArrived%%`);
      setItems(list);
    });
  }, []);

  function handleAdd() {
    console.log(`${since()} ms: %%clickHandled%%`);
    setClicks(clicks + 1);
  }

  return (
    <main>
      <h1>%%title%%</h1>
      <button onClick={handleAdd}>%%add%%</button>
      {clicks > 0 && <p>{`%%pressed%% ${clicks}`}</p>}
      {items === null ? (
        <p role="status">%%loading%%</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
