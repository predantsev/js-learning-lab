import { useEffect, useState } from "react";
import { loadTasks, type Task } from "./tasksApi";

// One value that is always exactly one of four states.
type Status =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "ready"; tasks: Task[] };

function assertNever(value: never): never {
  throw new Error(`Unhandled status: ${JSON.stringify(value)}`);
}

export function StatusScreen() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const [attempt, setAttempt] = useState(0); // Refresh and Try again bump it

  useEffect(() => {
    loadTasks().then(
      (tasks) => setStatus(tasks.length === 0 ? { kind: "empty" } : { kind: "ready", tasks }),
      () => setStatus({ kind: "error", message: "%%loadFailed%%" }),
    );
  }, [attempt]);

  function load() {
    setStatus({ kind: "loading" });
    setAttempt(attempt + 1);
  }

  switch (status.kind) {
    case "loading":
      return <p>%%loading%%</p>;
    case "empty":
      return (
        <p>
          %%noTasks%% <button>%%createFirst%%</button>
        </p>
      );
    case "error":
      return (
        <p>
          {status.message} <button onClick={load}>%%retry%%</button>
        </p>
      );
    case "ready":
      return (
        <section>
          <ul>
            {status.tasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
          <button onClick={load}>%%refresh%%</button>
        </section>
      );
    default:
      return assertNever(status);
  }
}
