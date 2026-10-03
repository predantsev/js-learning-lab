import { useState } from "react";

// Stability label of each React API this card's future server/client split relies on:
// "stable", "canary" or "experimental".
export const RSC_LABELS = {
  serverComponents: "stable", // React 19
  useClient: "stable", // React 19
  taintUniqueValue: "experimental", // react@experimental only
};

// Would move to a Server Component: shows data from props only.
export function HabitSummary({ habit }) {
  return (
    <>
      <h2>{habit.name}</h2>
      <p>{`%%completions%% ${habit.completions.length}`}</p>
    </>
  );
}

// Stays a Client Component ("use client" at the top of its own file in an RSC framework).
export function CompleteButton({ habitId, initiallyDone }) {
  const [done, setDone] = useState(initiallyDone);
  return (
    <button data-habit={habitId} onClick={() => setDone(!done)}>
      {done ? "%%doneToday%%" : "%%markDone%%"}
    </button>
  );
}

// Passes only plain data across: an id and a boolean.
export default function HabitCard({ habit, today }) {
  return (
    <article>
      <HabitSummary habit={habit} />
      <CompleteButton habitId={habit.id} initiallyDone={habit.completions.includes(today)} />
    </article>
  );
}
