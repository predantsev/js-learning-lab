import { useRecords } from "./useRecords.js";

export default function TaskList() {
  const { status, records } = useRecords();

  switch (status) {
    case "loading":
      return <p role="status">%%loading%%</p>;
    case "error":
      return <p role="alert">%%loadError%%</p>;
    default:
      return (
        <ul>
          {records.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
      );
  }
}
