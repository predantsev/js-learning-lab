export function TaskRow({ task }) {
  return (
    <li data-task={task.id}>
      <span>{task.title} · {task.dueDate}</span>{" "}
      <input aria-label={`%%noteFor%% ${task.title} ${task.dueDate}`} />{" "}
      <button type="button" data-id={task.id}>%%delete%% {task.dueDate}</button>
    </li>
  );
}
