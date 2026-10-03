// The web app. Read-only: it takes the domain from "./domain" and the platform parts from their own folders.
import { useState } from "react";
import { addCompletion, validateHabit } from "./domain";
import type { Habit } from "./domain";
import { loadHabits, saveHabits } from "./storage/habitStorage";
import { HabitCard } from "./ui/HabitCard";

const START: Habit[] = [
  { id: "h-01", name: "%%exercise%%", frequency: "daily", active: true, completions: ["2026-02-28", "2026-03-01"] },
  { id: "h-04", name: "%%tidy%%", frequency: "weekly", active: true, completions: ["2026-02-22"] },
];
const TODAY = "2026-03-02";

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits(START));
  const check = validateHabit({ name: "%%walk%%", frequency: "monthly" });

  function done(id: string) {
    const next = habits.map((habit) => (habit.id === id ? addCompletion(habit, TODAY) : habit));
    saveHabits(next);
    setHabits(next);
  }

  return (
    <section>
      <ul>
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} onDone={() => done(habit.id)} />
        ))}
      </ul>
      <p data-part="check">validateHabit: {check.ok ? "ok" : Object.keys(check.errors).join(", ")}</p>
    </section>
  );
}
