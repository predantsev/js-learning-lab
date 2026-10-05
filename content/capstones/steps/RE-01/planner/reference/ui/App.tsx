// The whole page as a tree of components: App → Section → TaskForm and Section → TaskList → one TaskCard per task.
// The numbers come from the pure domain functions, which stay exactly as they were.
import { countDueTasks } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";
import { TaskForm } from "./TaskForm.tsx";
import { TaskList } from "./TaskList.tsx";
import { Section } from "./Section.tsx";

type AppProps = { tasks: Task[]; today: string };

export function App({ tasks, today }: AppProps) {
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/task.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        <TaskForm />
      </Section>
      <p>
        %%dueSummary%% {formatDay(today, LOCALE)}: {countDueTasks(tasks, today)}
      </p>
      <Section title="%%listTitle%%">
        <TaskList tasks={tasks} />
      </Section>
    </main>
  );
}
