type TaskCardProps = {
  title: string;
  dueDate: string | null;
  done: boolean;
};

export function TaskCard({ title, dueDate, done }: TaskCardProps) {
  return (
    <article>
      <h3>{title}</h3>
      <p>{dueDate ?? "%%noDue%%"}</p>
      <p>{done ? "%%doneLabel%%" : "%%pendingLabel%%"}</p>
    </article>
  );
}
