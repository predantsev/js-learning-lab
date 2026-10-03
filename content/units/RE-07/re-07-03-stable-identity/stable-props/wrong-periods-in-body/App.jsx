import { useState } from "react";
import { HABITS, activeHabits } from "./habits";
import { PeriodPicker } from "./PeriodPicker";


function ActiveCount({ habits }) {
  return (
    <p>
      %%activeLabel%% {habits.length}
    </p>
  );
}

function HabitList({ habits, onPause }) {
  return (
    <ul>
      {habits.map((habit) => (
        <li key={habit.id}>
          {habit.name}{" "}
          <button onClick={() => onPause(habit.id)}>
            %%pause%% {habit.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function MostDone({ habits }) {
  const best = habits.reduce((leader, habit) => (habit.completions.length > leader.completions.length ? habit : leader));
  return (
    <p>
      %%mostDone%% {best.name}
    </p>
  );
}

export default function HabitBoard() {
  const [habits, setHabits] = useState(HABITS);
  const [period, setPeriod] = useState("week");
  const [note, setNote] = useState("");
  const PERIODS = ["week", "month", "year"];
  // Derived once per render and passed down: every child sees the same array.
  const active = activeHabits(habits);

  function pause(id) {
    setHabits(habits.map((habit) => (habit.id === id ? { ...habit, active: false } : habit)));
  }

  return (
    <main>
      <label>
        %%note%% <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <PeriodPicker periods={PERIODS} value={period} onChange={setPeriod} />
      <ActiveCount habits={active} />
      <HabitList habits={active} onPause={pause} />
      <MostDone habits={active} />
    </main>
  );
}
