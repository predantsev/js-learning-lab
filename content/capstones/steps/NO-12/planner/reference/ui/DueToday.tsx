// The tasks of today: #/tasks/summary. This module is not in dist/app.js: SummaryRoute.tsx loads it
// with React.lazy when the route opens, and esbuild (--splitting) writes it to its own file.
import { countDueTasks, sortTasks, priorityText } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";
import { Link } from "./router.tsx";
import { useTasksList } from "./tasksCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";

export default function DueToday({ today }: { today: string }) {
  const all = useTasksList("all");
  const headingRef = useHeadingFocus("%%summaryTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  // Pending tasks due exactly today, in the list's order (due date, then priority).
  const dueToday = sortTasks(all.items.filter((task) => !task.done && task.dueDate === today));
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%summaryTitle%%
      </h2>
      <p>
        %%dueSummary%% {formatDay(today, LOCALE)}: {countDueTasks(all.items, today)}
      </p>
      {dueToday.length === 0 ? (
        <p>%%noneDueTodayMessage%%</p>
      ) : (
        <ul>
          {dueToday.map((task) => (
            <li key={task.id}>
              <Link to={"/tasks/" + task.id}>{task.title}</Link> — {priorityText(task.priority)}
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link to="/tasks">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
