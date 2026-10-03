import { useState } from "react";

// Stability label of each React API this card's future server/client split relies on:
// "stable", "canary" or "experimental".
export const RSC_LABELS = {
  serverComponents: "",
  useClient: "",
  taintUniqueValue: "",
};

// Would move to a Server Component: shows data from props only.
export function HabitSummary({ habit }) {
  return null;
}

// Stays a Client Component: owns its state and its click handler.
export function CompleteButton({ habitId, initiallyDone }) {
  return null;
}

export default function HabitCard({ habit, today }) {
  const [done, setDone] = useState(habit.completions.includes(today));
  return (
    <article>
      <h2>{habit.name}</h2>
      <p>{`%%completions%% ${habit.completions.length}`}</p>
      <button onClick={() => setDone(!done)}>{done ? "%%doneToday%%" : "%%markDone%%"}</button>
    </article>
  );
}
