import { TaskRow } from "./TaskRow";

export function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
  );
}
