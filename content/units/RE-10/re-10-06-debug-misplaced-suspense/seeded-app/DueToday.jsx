import { tasks } from "./tasks";

const TODAY = "2026-03-02";

// Loaded lazily: the overview of open tasks due on or before today.
export default function DueToday() {
  const due = tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= TODAY);
  return (
    <section>
      <h2>%%dueToday%%</h2>
      <p>
        %%dueCount%%: {due.length}
      </p>
    </section>
  );
}
