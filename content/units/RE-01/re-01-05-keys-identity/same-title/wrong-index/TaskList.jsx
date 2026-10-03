import { TaskRow } from "./TaskRow";

// The index silences the warning, but it is a position, not an identity.
export function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((task, index) => (
        <TaskRow key={index} task={task} />
      ))}
    </ul>
  );
}
