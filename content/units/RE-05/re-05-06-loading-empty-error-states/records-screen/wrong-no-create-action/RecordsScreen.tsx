import { useTasks, type Status } from "./useTasks";

type Props = { onCreate: () => void };

// The short line that announces the current status.
function statusMessage(status: Status): string {
  switch (status.kind) {
    case "loading":
      return "%%loading%%";
    case "empty":
      return "%%noTasks%%";
    case "error":
      return "%%loadFailed%%";
    case "ready":
      return `%%loaded%% ${status.tasks.length}`;
    default:
      return assertNever(status);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled status: ${JSON.stringify(value)}`);
}

export function RecordsScreen({ onCreate }: Props) {
  const { status, retry } = useTasks();
  return (
    <section>
      <h2>%%tasks%%</h2>
      <p role="status">{statusMessage(status)}</p>
      {status.kind === "error" && <button onClick={retry}>%%retry%%</button>}
      {status.kind === "ready" && (
        <ul>
          {status.tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
