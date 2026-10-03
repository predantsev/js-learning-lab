import { useState } from "react";

// A custom hook: a piece of stateful logic with a name that starts with "use".
function useToggle(initial) {
  const [on, setOn] = useState(initial);
  function toggle() {
    setOn(!on);
  }
  return [on, toggle];
}

function TaskPanel({ title, details }) {
  const [open, toggle] = useToggle(false);
  return (
    <section>
      <h3>{title}</h3>
      <button aria-expanded={open} onClick={toggle}>
        {open ? "%%hide%%" : "%%show%%"}
      </button>
      {open && <p>{details}</p>}
    </section>
  );
}

export default function Planner() {
  return (
    <main>
      <TaskPanel title="%%plants%%" details="%%plantsDetails%%" />
      <TaskPanel title="%%library%%" details="%%libraryDetails%%" />
    </main>
  );
}
