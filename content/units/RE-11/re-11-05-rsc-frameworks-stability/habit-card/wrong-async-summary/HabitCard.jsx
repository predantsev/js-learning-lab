import { useState } from "react";

export const RSC_LABELS = { serverComponents: "stable", useClient: "stable", taintUniqueValue: "experimental" };

// Written "the server way" already: async. In a client runtime React refuses it.
export async function HabitSummary({ habit }) {
  return (
    <>
      <h2>{habit.name}</h2>
      <p>{`%%completions%% ${habit.completions.length}`}</p>
    </>
  );
}

export function CompleteButton({ initiallyDone }) {
  const [done, setDone] = useState(initiallyDone);
  return <button onClick={() => setDone(!done)}>{done ? "%%doneToday%%" : "%%markDone%%"}</button>;
}

export default function HabitCard({ habit, today }) {
  return (
    <article>
      <HabitSummary habit={habit} />
      <CompleteButton habitId={habit.id} initiallyDone={habit.completions.includes(today)} />
    </article>
  );
}
