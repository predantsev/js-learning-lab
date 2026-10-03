import { createContext, useContext, useState } from "react";
import { useHabits, useToggle } from "./useHabits.js";

// A context created only to skip HabitLayout and HabitSection.
const HabitsContext = createContext(null);

function HabitRow({ habit, compact, onComplete }) {
  console.log("render HabitRow", habit.id);
  const [open, toggle] = useToggle(false);
  // Compact mode shows no tips, "so the tips toggle is not needed there".
  const [tipsOpen, toggleTips] = compact ? [false, null] : useToggle(false);
  return (
    <li>
      {habit.name} — %%done%% {habit.completions.length}{" "}
      <button onClick={() => onComplete(habit.id)}>%%today%%</button>{" "}
      <button aria-expanded={open} onClick={toggle}>
        %%dates%%
      </button>
      {!compact && (
        <button aria-expanded={tipsOpen} onClick={toggleTips}>
          %%tips%%
        </button>
      )}
      {open && <p>{habit.completions.join(", ")}</p>}
      {tipsOpen && <p>%%tipText%%</p>}
    </li>
  );
}

function HabitList({ compact }) {
  console.log("render HabitList");
  const { habits, completeToday } = useContext(HabitsContext);
  return (
    <ul>
      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} compact={compact} onComplete={completeToday} />
      ))}
    </ul>
  );
}

function HabitSection({ compact }) {
  console.log("render HabitSection");
  return (
    <section>
      <h3>%%today%%</h3>
      <HabitList compact={compact} />
    </section>
  );
}

function HabitLayout({ compact }) {
  console.log("render HabitLayout");
  return (
    <div>
      <HabitSection compact={compact} />
    </div>
  );
}

export default function App() {
  console.log("render App");
  const { habits, addHabit, completeToday } = useHabits();
  const [draft, setDraft] = useState("");
  const [compact, setCompact] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    addHabit(draft);
    setDraft("");
  }

  return (
    <HabitsContext value={{ habits, completeToday }}>
      <label>
        <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} /> %%compact%%
      </label>
      <HabitLayout compact={compact} />
      <form onSubmit={handleSubmit}>
        <label>
          %%newHabit%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit">%%add%%</button>
      </form>
    </HabitsContext>
  );
}
