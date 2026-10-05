import type { ReactNode } from "react";
import { countDueTasks } from "./domain";
import type { Task } from "./domain";

type CardProps = { title: string; children: ReactNode };

export function Card({ title, children }: CardProps) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

type RecordCardProps = { task: Task };

export function RecordCard({ task }: RecordCardProps) {
  return (
    <li data-id={task.id}>
      <h3>{task.title}</h3>
      <p>{task.dueDate}</p>
      <p>{task.done ? "%%doneLabel%%" : "%%pendingLabel%%"}</p>
    </li>
  );
}

type RecordListProps = { tasks: Task[] };

export function RecordList({ tasks }: RecordListProps) {
  if (tasks.length === 0) return <p>%%empty%%</p>;
  return (
    <ul>
      {tasks.map((task) => (
        <RecordCard key={task.id} task={task} />
      ))}
    </ul>
  );
}

type AppProps = { tasks: Task[]; today: string };

export function App({ tasks, today }: AppProps) {
  return (
    <Card title="%%heading%%">
      <p>%%dueNow%%: {countDueTasks(tasks, today)}</p>
      <RecordList tasks={tasks} />
    </Card>
  );
}
