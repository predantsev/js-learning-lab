import { useEffect, useState } from "react";
import { listen, unlisten } from "./keyboard.js";

const TASK_IDS = ["t-01", "t-02", "t-03"];
// The lab answers t-01 slowly and the others quickly.
const delayFor = (id) => (id === "t-01" ? 1200 : 150);

export default function TaskDetail() {
  const [selectedId, setSelectedId] = useState(null);
  const [task, setTask] = useState(null);

  useEffect(() => {
    if (selectedId === null) return;
    console.log(`effect: fetch ${selectedId}`);
    fetch(`/lab/planner/items/${selectedId}?lang=%%lang%%&delay=${delayFor(selectedId)}`)
      .then((response) => response.json())
      .then((data) => {
        console.log(`response: ${data.id} → setTask`);
        setTask(data);
      });
  }, [selectedId]);

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "j") return;
      setSelectedId((id) => TASK_IDS[(TASK_IDS.indexOf(id) + 1) % TASK_IDS.length]);
    }
    listen(onKey);
    return () => unlisten((event) => onKey(event));
  }, []);

  return (
    <section>
      {TASK_IDS.map((id) => (
        <button key={id} aria-pressed={selectedId === id} onClick={() => setSelectedId(id)}>
          {id}
        </button>
      ))}
      <p>
        %%selected%% {selectedId ?? "—"}
      </p>
      <p>{task ? task.title : "%%pick%%"}</p>
    </section>
  );
}
