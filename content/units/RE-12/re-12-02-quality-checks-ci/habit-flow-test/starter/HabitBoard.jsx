import { useState } from "react";

const START = [
  { id: "h-1", name: "%%walk%%" },
  { id: "h-2", name: "%%read%%" },
];

export default function HabitBoard() {
  const [habits, setHabits] = useState(START);
  const [name, setName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") return;
    setHabits((current) => [...current, { id: `h-${current.length + 1}`, name: trimmed }]);
    setName("");
  }

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <label htmlFor="habit-name">%%habitName%%</label>
        <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit">%%add%%</button>
      </form>
      <ul aria-label="%%habitsList%%">
        {habits.map((habit) => (
          <li key={habit.id}>{habit.name}</li>
        ))}
      </ul>
    </section>
  );
}
