// The list of tasks: one TaskCard per task, keyed by the task's id, or a message when there are none.
import type { Task } from "../domain/tasks.ts";
import { TaskCard } from "./TaskCard.tsx";

type TaskListProps = {
  tasks: Task[];
  emptyText: string;
  onToggle: (task: Task) => void;
  onRemove: (id: string) => void;
};

export function TaskList({ tasks, emptyText, onToggle, onRemove }: TaskListProps) {
  if (tasks.length === 0) {
    return <p>{emptyText}</p>;
  }
  return (
    <ul className="cards">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onToggle={onToggle} onRemove={onRemove} />
      ))}
    </ul>
  );
}
