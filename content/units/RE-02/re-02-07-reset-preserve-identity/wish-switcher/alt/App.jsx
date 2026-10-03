import { useState } from "react";
import { wishes } from "./wishes.js";
import WishPicker from "./WishPicker";
import EditForm from "./EditForm";

export default function App() {
  const [selectedId, setSelectedId] = useState(wishes[0].id);
  const selected = wishes.find((wish) => wish.id === selectedId);

  return (
    <main>
      <h1>%%title%%</h1>
      <WishPicker selectedId={selectedId} onSelect={setSelectedId} />
      <div key={selectedId}>
        <EditForm wish={selected} />
      </div>
    </main>
  );
}
