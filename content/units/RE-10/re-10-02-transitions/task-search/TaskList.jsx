import { memo } from "react";
import { tasks } from "./tasks";

const SHOWN = 200;

// Imitates a heavy row: each row deliberately keeps the main thread busy for 1 ms.
function SlowRow({ task }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{task.title}</li>;
}

// memo (RE-07): the list renders again only when its `query` prop changes.
export const TaskList = memo(function TaskList({ query }) {
  const needle = query.toLowerCase();
  const matches = tasks.filter((task) => task.title.toLowerCase().includes(needle));
  return (
    <section>
      <p>%%found%%: {matches.length}</p>
      <ul>
        {matches.slice(0, SHOWN).map((task) => (
          <SlowRow key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
});
