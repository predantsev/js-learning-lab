import { createContext, memo, useContext, useState } from "react";
import { HABITS } from "./habits";
import { countRender } from "./profile";

const TodayContext = createContext(null);

const HabitCard = memo(function HabitCard({ habit }) {
  countRender("HabitCard");
  const { today, markDone } = useContext(TodayContext);
  const doneToday = habit.completions.includes(today);
  return (
    <li>
      {habit.name}{" "}
      <button aria-pressed={doneToday} onClick={() => markDone(habit.id)}>
        {doneToday ? "%%doneToday%%" : "%%markToday%%"}
      </button>
    </li>
  );
});

export default function HabitBoard() {
  countRender("HabitBoard");
  const [habits, setHabits] = useState(HABITS);
  const [note, setNote] = useState("");
  const today = "2026-03-01";

  function markDone(id) {
    setHabits((current) => current.map((habit) => (habit.id === id ? { ...habit, completions: [...habit.completions, today] } : habit)));
  }

  return (
    <TodayContext value={{ today, markDone }}>
      <label>
        %%note%% <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <ul>
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </ul>
    </TodayContext>
  );
}
