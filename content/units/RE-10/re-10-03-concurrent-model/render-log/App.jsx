import { useState, useTransition } from "react";
import { HabitList, seenQueries } from "./HabitList";

const DEMO = "%%demo%%";

export default function App() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  function changeQuery(value) {
    setText(value);
    startTransition(() => setQuery(value));
  }

  // Types the three letters of DEMO 50 ms apart — faster than the list can render.
  function typeQuickly() {
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => changeQuery(DEMO.slice(0, i)), (i - 1) * 50);
    }
  }

  return (
    <div>
      <label>
        %%search%% <input value={text} onChange={(event) => changeQuery(event.target.value)} />
      </label>{" "}
      <button onClick={typeQuickly}>%%typeQuickly%%</button>{" "}
      <button onClick={() => console.log("seenQueries:", seenQueries.join(" | "))}>%%showSeen%%</button>
      <HabitList query={query} />
    </div>
  );
}
