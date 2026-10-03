import { useState } from "react";
import HabitFeed from "./HabitFeed";
import { publish } from "./feed.js";

// Synthetic completions; every published one gets its own id.
const COMPLETIONS = [
  { habit: "%%exercise%%", date: "2026-03-01" },
  { habit: "%%reading%%", date: "2026-03-01" },
  { habit: "%%water%%", date: "2026-03-02" },
];

export default function App() {
  const [shown, setShown] = useState(true);
  const [sent, setSent] = useState(0);

  function handlePublish() {
    const id = `c-${String(sent + 1).padStart(2, "0")}`;
    publish({ id, ...COMPLETIONS[sent % COMPLETIONS.length] });
    setSent(sent + 1);
  }

  return (
    <main>
      <button onClick={handlePublish}>%%publish%%</button>
      <button onClick={() => setShown(!shown)}>{shown ? "%%hide%%" : "%%show%%"}</button>
      {shown && <HabitFeed />}
    </main>
  );
}
