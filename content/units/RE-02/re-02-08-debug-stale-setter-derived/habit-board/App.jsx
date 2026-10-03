import { useState } from "react";

const startHabits = [
  { id: "h-01", name: "%%exercise%%", done: false },
  { id: "h-02", name: "%%reading%%", done: false },
  { id: "h-03", name: "%%water%%", done: false },
];

export default function HabitBoard() {
  const [habits, setHabits] = useState(startHabits);
  const [doneCount, setDoneCount] = useState(0);
  console.log("render:", habits.filter((h) => h.done).map((h) => h.id).join(",") || "-", "doneCount =", doneCount);

  // "Saving" takes half a second, then the habit is marked as done.
  function handleDone(id) {
    setTimeout(() => {
      console.log("timer for", id, "sees doneCount =", doneCount);
      setHabits(habits.map((h) => (h.id === id ? { ...h, done: true } : h)));
      setDoneCount(doneCount + 1);
    }, 500);
  }

  function handleUndo(id) {
    setHabits(habits.map((h) => (h.id === id ? { ...h, done: false } : h)));
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <p>%%doneToday%%: {doneCount}</p>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            {habit.name} — {habit.done ? "%%done%%" : "%%notYet%%"}{" "}
            {habit.done ? (
              <button onClick={() => handleUndo(habit.id)}>%%undo%%</button>
            ) : (
              <button onClick={() => handleDone(habit.id)}>%%markDone%%</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
