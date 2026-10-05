import { useState } from "react";

export default function TaskFilter() {
  // Reads the visitor's saved choice during render.
  const [filter, setFilter] = useState(() => localStorage.getItem("planner.filter") ?? "all");

  console.log(`render: filter = "${filter}"`);

  function toggle() {
    const next = filter === "all" ? "pending" : "all";
    localStorage.setItem("planner.filter", next);
    setFilter(next);
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <p>
        %%showing%%: <b>{filter === "all" ? "%%allTasks%%" : "%%pendingTasks%%"}</b>
      </p>
      <button onClick={toggle}>{filter === "all" ? "%%onlyPending%%" : "%%showAll%%"}</button>
    </section>
  );
}
