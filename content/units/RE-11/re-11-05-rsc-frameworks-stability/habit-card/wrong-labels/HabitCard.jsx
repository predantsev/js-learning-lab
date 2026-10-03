import { useState } from "react";

// "Anything about the server is still experimental" — not what the React docs say.
export const RSC_LABELS = { serverComponents: "experimental", useClient: "canary", taintUniqueValue: "experimental" };

export function HabitSummary({ habit }) {
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
