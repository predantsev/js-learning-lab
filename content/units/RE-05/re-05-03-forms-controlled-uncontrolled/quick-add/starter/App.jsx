import { useState } from "react";
import { validateHabit, MESSAGES } from "./habits.js";

const FREQUENCY = { daily: "%%daily%%", weekly: "%%weekly%%" };

export default function QuickAdd() {
  const [habits, setHabits] = useState([{ id: "h-03", name: "%%water%%", frequency: "daily" }]);
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    // TODO: keep the page from reloading, read "name" and "frequency" with FormData,
    // pass them to validateHabit, then either add the habit and clear the form,
    // or put the message key of the first error into `error`.
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
