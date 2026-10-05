import { useReducer } from "react";
import { loggedReducer } from "./tasksRequest";
import type { Task } from "./tasksRequest";

const ANSWER: Task[] = [
  { id: "t-01", title: "%%plants%%", done: false },
  { id: "t-02", title: "%%library%%", done: false },
  { id: "t-03", title: "%%grandma%%", done: false },
];

export default function TaskLoader() {
  const [state, dispatch] = useReducer(loggedReducer, { status: "idle" });

  return (
    <section>
      <h2>%%heading%%</h2>
      <p>
        <button onClick={() => dispatch({ type: "started" })}>%%start%%</button>{" "}
        <button onClick={() => dispatch({ type: "succeeded", tasks: ANSWER })}>%%answer%%</button>{" "}
        <button onClick={() => dispatch({ type: "failed", message: "%%offline%%" })}>%%fail%%</button>
      </p>
      {state.status === "idle" && <p>%%idleText%%</p>}
      {state.status === "loading" && <p role="status">%%loadingText%%</p>}
      {state.status === "failure" && <p role="alert">{state.message}</p>}
      {state.status === "success" && (
        <ul>
          {state.tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
