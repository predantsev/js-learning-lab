import { habit } from "./habit.js";

// Turn the HTML card from the task into JSX built from `habit`.
export function HabitCard() {
  return (
    <article className="habit-card">
      <h3>{habit.name}</h3>
      <img src="img/habit.svg" alt={`%%iconOf%%: ${habit.name}`} />
      <label htmlFor={`${habit.id}-count`}>%%doneTimes%%</label>
      <output id={`${habit.id}-count`}>{habit.completions.length}</output>
    </article>
  );
}
