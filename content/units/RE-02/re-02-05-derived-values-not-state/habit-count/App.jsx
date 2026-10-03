import { useState } from "react";

const startHabits = [
  { id: "h-01", name: "%%exercise%%", active: true },
  { id: "h-02", name: "%%reading%%", active: true },
  { id: "h-05", name: "%%words%%", active: false },
];

export default function HabitList() {
  const [habits, setHabits] = useState(startHabits);
  // A second copy of a fact that `habits` already holds:
  const [activeCount, setActiveCount] = useState(2);

  function handleAddWalk() {
    setHabits([...habits, { id: "h-06", name: "%%walk%%", active: true }]);
  }

  function handleRemove(habit) {
    setHabits(habits.filter((h) => h.id !== habit.id));
    if (habit.active) {
      setActiveCount(activeCount - 1);
    }
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <p>%%activeLabel%%: {activeCount}</p>
      <button onClick={handleAddWalk} disabled={habits.some((h) => h.id === "h-06")}>
        %%addWalk%%
      </button>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            {habit.name} ({habit.active ? "%%active%%" : "%%paused%%"}){" "}
            <button onClick={() => handleRemove(habit)}>%%remove%%</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
