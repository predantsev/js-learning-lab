import { useEffect, useState } from "react";
import { tasks } from "./tasks.js";

export default function TaskBoard() {
  const [showDone, setShowDone] = useState(false);

  // Keyboard shortcut: the F key shows or hides the done tasks.
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "f") setShowDone((current) => !current);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const visible = showDone ? tasks : tasks.filter((task) => !task.done);

  return (
    <section>
      <h2>%%heading%%</h2>
      <input
        id="show-done"
        type="checkbox"
        checked={showDone}
        onChange={(event) => setShowDone(event.target.checked)}
      />
      <label htmlFor="show-done">%%showDone%%</label>
      <p>%%shortcutHint%%</p>
      <ul>
        {visible.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
