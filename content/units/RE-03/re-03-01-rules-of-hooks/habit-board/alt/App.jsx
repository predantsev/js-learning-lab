import { useState } from "react";
import { HABITS } from "./habits.js";

// One state for all rows: the ids of the open rows.
export default function HabitBoard() {
  const [habits, setHabits] = useState(HABITS);
  const [filter, setFilter] = useState("active");
  const [openIds, setOpenIds] = useState([]);

  if (habits.length === 0) {
    return <p>%%empty%%</p>;
  }

  const shown = habits.filter((habit) => (filter === "active" ? habit.active : !habit.active));

  function toggle(id) {
    setOpenIds(openIds.includes(id) ? openIds.filter((openId) => openId !== id) : [...openIds, id]);
  }

  return (
    <section>
      <h2>%%heading%%</h2>
      <button onClick={() => setFilter(filter === "active" ? "paused" : "active")}>
        {filter === "active" ? "%%showPaused%%" : "%%showActive%%"}
      </button>
      <ul>
        {shown.map((habit) => {
          const open = openIds.includes(habit.id);
          return (
            <li key={habit.id}>
              <button aria-expanded={open} onClick={() => toggle(habit.id)}>
                {habit.name}
              </button>
              {open && <span> %%doneTimes%% {habit.completions.length}</span>}{" "}
              <button onClick={() => setHabits(habits.filter((item) => item.id !== habit.id))}>%%remove%%</button>
            </li>
          );
        })}
      </ul>
      <button onClick={() => setHabits([])}>%%clearAll%%</button>
    </section>
  );
}
