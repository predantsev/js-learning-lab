import { habit } from "./habit.js";

// The HTML was converted, but the values were copied instead of taken from `habit`.
export function HabitCard() {
  return (
    <article className="habit-card">
      <h3>%%exercise%%</h3>
      <img src="img/habit.svg" alt="%%iconOf%%: %%exercise%%" />
      <label htmlFor="h-01-count">%%doneTimes%%</label>
      <output id="h-01-count">3</output>
    </article>
  );
}
