import { useReducer } from "react";

export const RSC_LABELS = { serverComponents: "stable", useClient: "stable", taintUniqueValue: "experimental" };

export function HabitSummary({ habit }) {
  return (
    <header>
      <h2>{habit.name}</h2>
      <p>
        %%completions%% <strong>{habit.completions.length}</strong>
      </p>
    </header>
  );
}

export function CompleteButton({ initiallyDone }) {
  const [done, toggle] = useReducer((current) => !current, initiallyDone);
  return <button onClick={toggle}>{done ? "%%doneToday%%" : "%%markDone%%"}</button>;
}

export default function HabitCard({ habit, today }) {
  const initiallyDone = habit.completions.includes(today);
  return (
    <article>
      <HabitSummary habit={habit} />
      <CompleteButton habitId={habit.id} initiallyDone={initiallyDone} />
    </article>
  );
}
