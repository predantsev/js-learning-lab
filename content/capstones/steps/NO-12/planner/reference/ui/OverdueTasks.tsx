// The overdue tasks: #/tasks/overdue. Pending tasks whose due date is before the given day (passed in,
// not read from the clock), the most important first; equal priorities by the older due date.
import type { Task, Priority } from "../domain/tasks.ts";
import { priorityText } from "../domain/tasks.ts";
import { Link } from "./router.tsx";
import { useTasksList } from "./tasksCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { formatDay, LOCALE } from "./format.js";

const RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

// Pure: "YYYY-MM-DD" text compares like the dates it holds.
export function overdueTasks(list: readonly Task[], today: string): Task[] {
  return list
    .filter((task) => !task.done && task.dueDate !== null && task.dueDate < today)
    .toSorted((a, b) => RANK[a.priority] - RANK[b.priority] || (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
}

export function OverdueTasks({ today }: { today: string }) {
  const all = useTasksList("all");
  const headingRef = useHeadingFocus("%%overdueTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const overdue = overdueTasks(all.items, today);
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%overdueTitle%%
      </h2>
      <p>
        %%overdueBeforeLabel%% {formatDay(today, LOCALE)}: {overdue.length}
      </p>
      {overdue.length === 0 ? (
        <p>%%noOverdueMessage%%</p>
      ) : (
        <ol>
          {overdue.map((task) => (
            <li key={task.id}>
              <Link to={"/tasks/" + task.id}>{task.title}</Link> — {priorityText(task.priority)} · {formatDay(task.dueDate ?? today, LOCALE)}
            </li>
          ))}
        </ol>
      )}
      <p>
        <Link to="/tasks">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
