import { useState } from "react";
import { HABITS } from "./habits.js";

function HabitRow({ habit, onRemove }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button aria-expanded={open} onClick={() => setOpen(!open)}>
        {habit.name}
      </button>
      {open && <span> %%doneTimes%% {habit.completions.length}</span>}{" "}
      <button onClick={() => onRemove(habit.id)}>%%remove%%</button>
    </li>
  );
}

export default function HabitBoard() {
  const [habits, setHabits] = useState(HABITS);
  if (habits.length === 0) {
    return <p>%%empty%%</p>;
  }

  const [filter, setFilter] = useState("active");

  const shown = habits.filter((habit) => (filter === "active" ? habit.active : !habit.active));

  return (
    <section>
      <h2>%%heading%%</h2>
      <button onClick={() => setFilter(filter === "active" ? "paused" : "active")}>
        {filter === "active" ? "%%showPaused%%" : "%%showActive%%"}
      </button>
      <ul>
        {shown.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            onRemove={(id) => setHabits(habits.filter((item) => item.id !== id))}
          />
        ))}
      </ul>
      <button onClick={() => setHabits([])}>%%clearAll%%</button>
    </section>
  );
}
