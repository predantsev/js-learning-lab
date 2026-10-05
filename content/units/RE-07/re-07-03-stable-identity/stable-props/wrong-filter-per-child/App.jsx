import { useState } from "react";
import { HABITS, activeHabits } from "./habits";
import { PeriodPicker } from "./PeriodPicker";

const PERIODS = ["week", "month", "year"];

function ActiveCount({ habits }) {
  const active = activeHabits(habits);
  return (
    <p>
      %%activeLabel%% {active.length}
    </p>
  );
}

function HabitList({ habits, onPause }) {
  const active = activeHabits(habits);
  return (
    <ul>
      {active.map((habit) => (
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
  const active = activeHabits(habits);
  const best = active.reduce((leader, habit) => (habit.completions.length > leader.completions.length ? habit : leader));
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

  function pause(id) {
    setHabits(habits.map((habit) => (habit.id === id ? { ...habit, active: false } : habit)));
  }

  return (
    <main>
      <label>
        %%note%% <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <PeriodPicker periods={PERIODS} value={period} onChange={setPeriod} />
      <ActiveCount habits={habits} />
      <HabitList habits={habits} onPause={pause} />
      <MostDone habits={habits} />
    </main>
  );
}
