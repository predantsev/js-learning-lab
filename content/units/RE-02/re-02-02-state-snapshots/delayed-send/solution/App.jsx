import { useState } from "react";

export default function ReminderDraft() {
  const [draft, setDraft] = useState("%%waterPlants%%");

  function handleSend() {
    setTimeout(() => {
      console.log("%%sent%%", draft);
    }, 1000);
    setDraft("");
  }

  return (
    <section>
      <h1>%%title%%</h1>
      {/* The field is already connected to `draft`; a later lesson explains how. */}
      <label>
        %%reminder%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <button onClick={handleSend}>%%send%%</button>
    </section>
  );
}
