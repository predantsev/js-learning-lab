import { useState } from "react";
import { STATUS_OPTIONS, TASKS, matchesStatus } from "./tasks";
import type { StatusOption } from "./tasks";
import { SelectList } from "./SelectList";

export default function App() {
  const [status, setStatus] = useState<StatusOption>(STATUS_OPTIONS[0]);
  const visible = TASKS.filter((task) => matchesStatus(task, status));

  return (
    <section>
      <h2>%%heading%%</h2>
      <SelectList
        label="%%statusLabel%%"
        items={STATUS_OPTIONS}
        selected={status}
        getKey={(option) => option.id}
        getLabel={(option) => option.label}
        onSelect={setStatus}
      />
      <ul>
        {visible.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
