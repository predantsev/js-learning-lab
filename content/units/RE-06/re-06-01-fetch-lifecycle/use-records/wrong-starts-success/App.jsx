import { useRecords } from "./useRecords.js";

export default function TaskList() {
  const { status, records } = useRecords();

  if (status === "loading") return <p role="status">%%loading%%</p>;
  if (status === "error") return <p role="alert">%%loadError%%</p>;
  return (
    <ul>
      {records.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
