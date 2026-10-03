import { Link } from "./router";

const PRIORITY = { low: "%%low%%", normal: "%%normal%%", high: "%%high%%" };

// One task's details.
export function TaskCard({ task }) {
  return (
    <section>
      <h2>{task.title}</h2>
      <p>%%due%% {task.dueDate ?? "%%noDue%%"}</p>
      <p>%%priority%% {PRIORITY[task.priority]}</p>
    </section>
  );
}

// What to show when no task has this id.
export function TaskNotFound({ id }) {
  return (
    <section>
      <h2>%%notFound%%</h2>
      <p>
        %%noTaskWithId%% <code>{id}</code>.
      </p>
      <Link to="/tasks">%%backToList%%</Link>
    </section>
  );
}
