import { TaskRow } from "./TaskRow";

export function TaskList({ tasks }) {
  const rows = tasks.map((task) => <TaskRow key={`task-${task.id}`} task={task} />);
  return <ul>{rows}</ul>;
}
