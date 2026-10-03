import { useState } from "react";
import { task } from "./task.js";

export default function App() {
  const [done, setDone] = useState(task.done);
  const status = done ? "%%statusDone%%" : "%%statusPending%%";
  const action = done ? "%%markPending%%" : "%%markDone%%";

  return (
    <section>
      <h1>{task.title}</h1>
      <p className="status">{status}</p>
      <button onClick={() => setDone(!done)}>{action}</button>
    </section>
  );
}
