import { useState } from "react";
import { task } from "./task.js";

export default function App() {
  // TODO: keep the task's status in state, starting from task.done,
  // and flip it when the button is clicked.
  return (
    <section>
      <h1>{task.title}</h1>
      <p className="status">%%statusDone%%</p>
      <button>%%markPending%%</button>
    </section>
  );
}
