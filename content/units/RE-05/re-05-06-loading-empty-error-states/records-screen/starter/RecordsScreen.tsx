import { useTasks, type Status } from "./useTasks";

type Props = { onCreate: () => void };

// The short line that announces the current status.
function statusMessage(status: Status): string {
  // TODO
  return "";
}

export function RecordsScreen({ onCreate }: Props) {
  const { status, retry } = useTasks();
  // TODO: the status line, then exactly one body for the current status
  return (
    <section>
      <h2>%%tasks%%</h2>
    </section>
  );
}
