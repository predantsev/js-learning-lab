import { useState } from "react";
import { task } from "./task.js";

export default function App() {
  const [done, setDone] = useState(task.done);

  function handleClick() {
    setDone(!done);
  }

  return (
    <section>
      <h1>{task.title}</h1>
      <p className="status">{done ? "%%statusDone%%" : "%%statusPending%%"}</p>
      <button onClick={handleClick}>{done ? "%%markPending%%" : "%%markDone%%"}</button>
    </section>
  );
}
