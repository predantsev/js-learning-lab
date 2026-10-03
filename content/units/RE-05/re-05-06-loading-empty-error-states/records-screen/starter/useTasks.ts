import { useEffect, useState } from "react";
import { loadTasks, type Task } from "./tasksApi";

export type Status =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error" }
  | { kind: "ready"; tasks: Task[] };

// Loads the tasks on mount and again on every retry().
export function useTasks(): { status: Status; retry: () => void } {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false; // a load that finishes after unmount changes nothing
    loadTasks().then(
      (tasks) => {
        if (!ignore) setStatus(tasks.length === 0 ? { kind: "empty" } : { kind: "ready", tasks });
      },
      () => {
        if (!ignore) setStatus({ kind: "error" });
      },
    );
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setStatus({ kind: "loading" });
    setAttempt((count) => count + 1);
  }

  return { status, retry };
}
