import { useState } from "react";
import { readSaveStatus } from "./saveStatus.js";

const TASKS = [
  { id: "t-01", title: "%%plants%%" },
  { id: "t-02", title: "%%library%%" },
  { id: "t-03", title: "%%grandma%%" },
];

export default function SaveStatus() {
  const [selectedId, setSelectedId] = useState("t-01");
  const [label, setLabel] = useState("%%checking%%");

  // TODO: every 200 ms, put readSaveStatus(selectedId) into label.

  return (
    <section>
      {TASKS.map((task) => (
        <button key={task.id} aria-pressed={selectedId === task.id} onClick={() => setSelectedId(task.id)}>
          {task.title}
        </button>
      ))}
      <p>%%lastSaved%% {label}</p>
    </section>
  );
}
