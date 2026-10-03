import { useEffect, useState } from "react";

const KEY = "jsll.habits.v1";
const HABITS = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-03", name: "%%water%%" },
];

export default function HabitStore() {
  const [habits] = useState(HABITS);

  useEffect(() => {
    console.log("effect: setup");
    // Appends the habits to whatever is already stored.
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    localStorage.setItem(KEY, JSON.stringify([...stored, ...habits]));
    console.log(`stored records: ${JSON.parse(localStorage.getItem(KEY)).length}`);
    return () => console.log("effect: cleanup");
  }, [habits]);

  return (
    <ul>
      {habits.map((habit) => (
        <li key={habit.id}>{habit.name}</li>
      ))}
    </ul>
  );
}
