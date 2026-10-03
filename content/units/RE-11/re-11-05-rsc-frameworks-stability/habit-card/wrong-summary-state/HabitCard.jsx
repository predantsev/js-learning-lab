import { useState } from "react";

export const RSC_LABELS = { serverComponents: "stable", useClient: "stable", taintUniqueValue: "experimental" };

// The summary also keeps the "done" state — so it could not be a Server Component.
export function HabitSummary({ habit, today }) {
  const [done] = useState(habit.completions.includes(today));
  return (
    <>
      <h2>{done ? `✓ ${habit.name}` : habit.name}</h2>
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
      <HabitSummary habit={habit} today={today} />
      <CompleteButton habitId={habit.id} initiallyDone={habit.completions.includes(today)} />
    </article>
  );
}
