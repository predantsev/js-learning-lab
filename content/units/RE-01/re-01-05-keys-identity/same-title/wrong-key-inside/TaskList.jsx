import { TaskRow } from "./TaskRow";

// The key is passed as a prop called taskKey, so React never sees a key on the list item.
export function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((task) => (
        <TaskRow taskKey={task.id} task={task} />
      ))}
    </ul>
  );
}
