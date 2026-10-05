import { useTasks, type Status } from "./useTasks";

type Props = { onCreate: () => void };

// The short line that announces the current status.
const MESSAGES = {
  loading: "%%loading%%",
  empty: "%%noTasks%%",
  error: "%%loadFailed%%",
} as const;

function statusMessage(status: Status): string {
  if (status.kind === "ready") return "%%loaded%% " + status.tasks.length;
  return MESSAGES[status.kind];
}

export function RecordsScreen({ onCreate }: Props) {
  const { status, retry } = useTasks();
  let body = null;
  if (status.kind === "empty") body = <button onClick={() => onCreate()}>%%createFirst%%</button>;
  else if (status.kind === "error") body = <button onClick={() => retry()}>%%retry%%</button>;
  else if (status.kind === "ready")
    body = (
      <ul>
        {status.tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    );
  return (
    <section>
      <h2>%%tasks%%</h2>
      <div role="status" aria-live="polite">
        {statusMessage(status)}
      </div>
      {body}
    </section>
  );
}
