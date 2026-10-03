import { habit } from "./habit.js";

export function HabitCard() {
  const countId = habit.id + "-count";
  const alt = "%%iconOf%%: " + habit.name;
  return (
    <article className="habit-card">
      <h3>{habit.name}</h3>
      <img alt={alt} src="img/habit.svg" />
      <label htmlFor={countId}>%%doneTimes%%</label>
      <output id={countId}>{String(habit.completions.length)}</output>
    </article>
  );
}
