// The screen under test. Read-only.
import { useReducer, useState } from "react";
import type { SubmitEvent } from "react";
import { saveReducer } from "./saveReducer";
import { useTasksApi } from "./tasksApi";
import type { Task } from "./tasksApi";

export function TaskScreen() {
  const api = useTasksApi();
  const [save, dispatch] = useReducer(saveReducer, { status: "idle" });
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  async function create(action: "submitted" | "retried") {
    dispatch({ type: action });
    try {
      const task = await api.createTask(title.trim());
      setTasks((list) => [...list, task]);
      setTitle("");
      dispatch({ type: "saved" });
    } catch {
      dispatch({ type: "failed", message: "%%createFailed%%" });
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim() !== "") create("submitted");
  }

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-task">%%newTask%%</label>{" "}
        <input id="new-task" value={title} onChange={(event) => setTitle(event.target.value)} />{" "}
        <button type="submit" disabled={save.status === "saving"}>
          %%add%%
        </button>
      </form>
      {save.status === "failed" && (
        <div role="alert">
          <p>{save.message}</p>
          <button onClick={() => create("retried")}>%%retry%%</button>
        </div>
      )}
      <ul aria-label="%%taskList%%">
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
