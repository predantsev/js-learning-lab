import { memo, useEffect } from "react";
import { habits } from "./habits";

// Every query a list render has seen. Filled during render — a side effect, on purpose.
export const seenQueries = [];

let rendersStarted = 0;

// Imitates a heavy row: each row deliberately keeps the main thread busy for 1 ms.
function SlowRow({ habit }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{habit.name}</li>;
}

export const HabitList = memo(function HabitList({ query }) {
  rendersStarted += 1;
  console.log(`render #${rendersStarted}: "${query}"`); // instrumentation for this lesson only
  seenQueries.push(query);

  useEffect(() => {
    console.log(`commit: "${query}"`);
  }, [query]);

  const needle = query.toLowerCase();
  const matches = habits.filter((habit) => habit.name.toLowerCase().includes(needle));
  return (
    <ul>
      {matches.slice(0, 150).map((habit) => (
        <SlowRow key={habit.id} habit={habit} />
      ))}
    </ul>
  );
});
