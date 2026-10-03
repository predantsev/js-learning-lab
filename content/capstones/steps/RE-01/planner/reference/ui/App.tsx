// The whole page as a tree of components: App → TaskForm, TaskList → one TaskCard per task.
// The numbers come from the pure domain functions, which stay exactly as they were.
import { countDueTasks } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";
import { TaskForm } from "./TaskForm.tsx";
import { TaskList } from "./TaskList.tsx";

type AppProps = { tasks: Task[]; today: string };

export function App({ tasks, today }: AppProps) {
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/task.svg" alt="%%imageAlt%%" />
      <TaskForm />
      <p>
        %%dueSummary%% {formatDay(today, LOCALE)}: {countDueTasks(tasks, today)}
      </p>
      <h2>%%listTitle%%</h2>
      <TaskList tasks={tasks} />
    </main>
  );
}
