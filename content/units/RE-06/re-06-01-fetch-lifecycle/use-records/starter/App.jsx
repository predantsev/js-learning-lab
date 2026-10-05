import { useRecords } from "./useRecords.js";

export default function TaskList() {
  const { status, records } = useRecords();

  // TODO: one branch per status:
  // loading — the paragraph below; error — <p role="alert">%%loadError%%</p>;
  // success — a <ul> with one <li> per task title.
  return <p role="status">%%loading%%</p>;
}
