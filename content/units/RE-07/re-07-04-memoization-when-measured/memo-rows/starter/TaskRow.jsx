let renders = 0;

// One row of the board. It counts its renders so the checks can see how many rows rendered.
export function TaskRow({ task, onToggle }) {
  renders += 1;
  return (
    <li>
      <label>
        <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} /> {task.title}
      </label>
    </li>
  );
}

export function rowRenders() {
  return renders;
}
