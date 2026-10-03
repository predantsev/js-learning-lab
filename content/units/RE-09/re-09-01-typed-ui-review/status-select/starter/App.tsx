import { useState } from "react";
import { STATUS_OPTIONS, TASKS, matchesStatus } from "./tasks";
import type { StatusOption } from "./tasks";

export default function App() {
  const [status, setStatus] = useState<StatusOption>(STATUS_OPTIONS[0]);
  const visible = TASKS.filter((task) => matchesStatus(task, status));

  return (
    <section>
      <h2>%%heading%%</h2>
      {/* TODO: a SelectList of STATUS_OPTIONS named "%%statusLabel%%" that changes `status` */}
      <ul>
        {visible.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
