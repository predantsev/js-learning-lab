import { useState } from "react";
import { validateHabit, MESSAGES } from "./habits.js";

const FREQUENCY = { daily: "%%daily%%", weekly: "%%weekly%%" };

export default function QuickAdd() {
  const [habits, setHabits] = useState([{ id: "h-03", name: "%%water%%", frequency: "daily" }]);
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setHabits([...habits, { id: `h-new-${habits.length}`, name: data.get("name"), frequency: data.get("frequency") }]);
    form.reset();
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
