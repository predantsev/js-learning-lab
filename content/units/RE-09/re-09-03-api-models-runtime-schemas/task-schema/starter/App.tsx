// The planner screen. Read-only.
import { useEffect, useState } from "react";
import { loadTask, loadTasks } from "./tasksApi";
import type { ParseResult } from "./parsing";
import type { Task } from "./taskModel";

const MESSAGES: Record<string, string> = {
  notObject: "%%notObject%%",
  notArray: "%%notArray%%",
  required: "%%required%%",
  invalidDate: "%%invalidDate%%",
  notBoolean: "%%notBoolean%%",
  unknownPriority: "%%unknownPriority%%",
};

function Problems({ errors }: { errors: Record<string, string> }) {
  return (
    <div role="alert">
      <p>%%badResponse%%</p>
      <ul>
        {Object.entries(errors).map(([field, key]) => (
          <li key={field}>
            {field}: {MESSAGES[key] ?? key}
          </li>
        ))}
      </ul>
    </div>
  );
}

function useResult<T>(load: () => Promise<ParseResult<T>>): ParseResult<T> | null {
  const [result, setResult] = useState<ParseResult<T> | null>(null);
  useEffect(() => {
    let ignore = false;
    load().then((next) => {
      if (!ignore) setResult(next);
    });
    return () => {
      ignore = true;
    };
  }, [load]);
  return result;
}

function TaskList() {
  const result = useResult(loadTasks);
  if (result === null) return <p role="status">%%loading%%</p>;
  if (!result.ok) return <Problems errors={result.errors} />;
  return (
    <ul data-part="list">
      {result.value.map((task) => (
        <li key={task.id}>
          {task.title} · {task.priority}
        </li>
      ))}
    </ul>
  );
}

function TaskDetail() {
  const result = useResult(loadTask);
  if (result === null) return <p role="status">%%loading%%</p>;
  if (!result.ok) return <Problems errors={result.errors} />;
  return (
    <p data-part="detail">
      {result.value.title} · {result.value.dueDate ?? "%%noDate%%"}
    </p>
  );
}

export default function App() {
  return (
    <main>
      <h2>%%listHeading%%</h2>
      <TaskList />
      <h2>%%detailHeading%%</h2>
      <TaskDetail />
    </main>
  );
}
