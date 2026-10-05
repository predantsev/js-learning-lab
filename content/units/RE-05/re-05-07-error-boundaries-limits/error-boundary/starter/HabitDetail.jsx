import { useParams } from "./router";
import { habits } from "./habits.js";

export function HabitDetail() {
  const { id } = useParams();
  const habit = habits.find((candidate) => candidate.id === id);
  if (habit === undefined) return <h2>%%notFound%%</h2>;
  return (
    <section>
      <h2>{habit.name}</h2>
      <p>
        %%completions%% {habit.completions.length}
      </p>
    </section>
  );
}
