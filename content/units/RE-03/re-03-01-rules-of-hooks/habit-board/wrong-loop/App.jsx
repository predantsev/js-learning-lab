import { useState } from "react";
import { HABITS } from "./habits.js";

export default function HabitBoard() {
  const [habits, setHabits] = useState(HABITS);

  const [filter, setFilter] = useState("active");

  if (habits.length === 0) {
    return <p>%%empty%%</p>;
  }
  const shown = habits.filter((habit) => (filter === "active" ? habit.active : !habit.active));

  const rows = [];
  for (const habit of shown) {
    const [open, setOpen] = useState(false);
    rows.push(
      <li key={habit.id}>
        <button aria-expanded={open} onClick={() => setOpen(!open)}>
          {habit.name}
        </button>
        {open && <span> %%doneTimes%% {habit.completions.length}</span>}{" "}
        <button onClick={() => setHabits(habits.filter((item) => item.id !== habit.id))}>%%remove%%</button>
      </li>
    );
  }

  return (
    <section>
      <h2>%%heading%%</h2>
      <button onClick={() => setFilter(filter === "active" ? "paused" : "active")}>
        {filter === "active" ? "%%showPaused%%" : "%%showActive%%"}
      </button>
      <ul>{rows}</ul>
      <button onClick={() => setHabits([])}>%%clearAll%%</button>
    </section>
  );
}
