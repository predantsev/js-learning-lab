import { useEffect, useState } from "react";
import { loadTasks, type Task } from "./tasksApi";

// Three separate pieces of state that can contradict each other.
export function BooleanScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [attempt, setAttempt] = useState(0); // Refresh bumps it, and the effect loads again

  useEffect(() => {
    setIsLoading(true);
    loadTasks()
      .then((loaded) => setTasks(loaded))
      .catch(() => setError("%%loadFailed%%"))
      .finally(() => setIsLoading(false));
  }, [attempt]);

  if (isLoading) return <p>%%loading%%</p>;
  return (
    <section>
      {error && <p>{error}</p>}
      {tasks.length === 0 ? (
        <p>%%noTasks%%</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
      )}
      <button onClick={() => setAttempt(attempt + 1)}>%%refresh%%</button>
    </section>
  );
}
