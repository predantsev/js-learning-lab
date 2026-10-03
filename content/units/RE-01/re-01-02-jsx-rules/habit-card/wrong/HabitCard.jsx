import { habit } from "./habit.js";

// HTML attribute names kept: class and for.
export function HabitCard() {
  return (
    <article class="habit-card">
      <h3>{habit.name}</h3>
      <img src="img/habit.svg" alt={`%%iconOf%%: ${habit.name}`} />
      <label for={`${habit.id}-count`}>%%doneTimes%%</label>
      <output id={`${habit.id}-count`}>{habit.completions.length}</output>
    </article>
  );
}
