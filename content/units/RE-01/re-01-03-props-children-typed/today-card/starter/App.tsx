import { TaskCard } from "./TaskCard";
import { tasks } from "./tasks";

export function App() {
  return (
    <main>
      <TaskCard title={tasks[0].title} dueDate={tasks[0].dueDate} done={tasks[0].done} />
      <TaskCard title={tasks[1].title} dueDate={tasks[1].dueDate} done={tasks[1].done} />
    </main>
  );
}
