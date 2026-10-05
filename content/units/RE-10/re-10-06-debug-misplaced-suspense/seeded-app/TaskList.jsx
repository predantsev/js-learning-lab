import { memo } from "react";
import { tasks } from "./tasks";

// The course's slow-list control: how long each row deliberately keeps the main thread busy.
export const ROW_COST_MS = 1;

function SlowRow({ task }) {
  const start = performance.now();
  while (performance.now() - start < ROW_COST_MS) {}
  return <li>{task.title}</li>;
}

// memo (RE-07): the list renders again only when its `query` prop changes.
export const TaskList = memo(function TaskList({ query }) {
  const needle = query.toLowerCase();
  const matches = tasks.filter((task) => task.title.toLowerCase().includes(needle));
  return (
    <section aria-label="%%results%%">
      <p>%%found%%: {matches.length}</p>
      <ul>
        {matches.slice(0, 150).map((task) => (
          <SlowRow key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
});
