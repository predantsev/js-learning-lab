import { habit } from "./habit.js";

// The alt text was lost on the way.
export function HabitCard() {
  return (
    <article className="habit-card">
      <h3>{habit.name}</h3>
      <img src="img/habit.svg" />
      <label htmlFor={`${habit.id}-count`}>%%doneTimes%%</label>
      <output id={`${habit.id}-count`}>{habit.completions.length}</output>
    </article>
  );
}
