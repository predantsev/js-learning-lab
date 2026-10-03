import type { ReactNode } from "react";
import { countDueTasks } from "./domain";
import type { Task } from "./domain";

interface CardProps {
  title: string;
  children?: ReactNode;
}

export const Card = ({ title, children }: CardProps) => (
  <section className="card">
    <h2>{title}</h2>
    <div>{children}</div>
  </section>
);

export function RecordCard(props: { task: Task }) {
  const { id, title, dueDate, done } = props.task;
  const due = dueDate === null ? "%%noDue%%" : dueDate;
  return (
    <li data-id={id}>
      <h3>{title}</h3>
      <p>{due}</p>
      <p>{done ? "%%doneLabel%%" : "%%pendingLabel%%"}</p>
    </li>
  );
}

export function RecordList({ tasks }: { tasks: readonly Task[] }) {
  return tasks.length > 0 ? (
    <ul>
      {tasks.map((task) => <RecordCard key={task.id} task={task} />)}
    </ul>
  ) : (
    <p>%%empty%%</p>
  );
}

export function App({ tasks, today }: { tasks: Task[]; today: string }) {
  const due = countDueTasks(tasks, today);
  return (
    <main>
      <Card title="%%heading%%">
        <p>{`%%dueNow%%: ${due}`}</p>
        <RecordList tasks={tasks} />
      </Card>
    </main>
  );
}
