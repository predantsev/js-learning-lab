import { useState } from "react";
import { validateHabit, MESSAGES } from "./habits.js";

const FREQUENCY = { daily: "%%daily%%", weekly: "%%weekly%%" };

export default function QuickAdd() {
  const [habits, setHabits] = useState([{ id: "h-03", name: "%%water%%", frequency: "daily" }]);
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const fields = event.currentTarget.elements;
    const result = validateHabit({
      name: fields.namedItem("name").value,
      frequency: fields.namedItem("frequency").value,
    });
    if (result.ok) {
      setHabits((current) => [...current, { ...result.value, id: crypto.randomUUID() }]);
      setError(null);
      event.currentTarget.reset();
    } else {
      setError(result.errors.name ?? result.errors.frequency);
    }
  }

  return (
    <section>
      <h1>%%habits%%</h1>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            {habit.name} — {FREQUENCY[habit.frequency]}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <label htmlFor="quick-name">%%name%%</label> <input id="quick-name" name="name" />{" "}
        <label htmlFor="quick-frequency">%%frequency%%</label>{" "}
        <select id="quick-frequency" name="frequency" defaultValue="daily">
          <option value="daily">%%daily%%</option>
          <option value="weekly">%%weekly%%</option>
        </select>{" "}
        <button>%%add%%</button>
        {error && <p id="quick-error">{MESSAGES[error]}</p>}
      </form>
    </section>
  );
}
