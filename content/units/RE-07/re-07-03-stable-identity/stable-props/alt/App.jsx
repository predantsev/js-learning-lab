import { useState } from "react";
import { HABITS, activeHabits } from "./habits";
import { PeriodPicker } from "./PeriodPicker";

// The list never changes, so it is created once, when the module loads.
const PERIOD_IDS = ["week", "month", "year"];

function ActiveCount({ count }) {
  return (
    <p>
      %%activeLabel%% {count}
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
      <PeriodPicker periods={PERIOD_IDS} value={period} onChange={setPeriod} />
      <ActiveCount count={active.length} />
      <HabitList habits={active} onPause={pause} />
      <MostDone habits={active} />
    </main>
  );
}
