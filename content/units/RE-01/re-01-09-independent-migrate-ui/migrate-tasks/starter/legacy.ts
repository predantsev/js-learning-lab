// The old page: one render function that writes HTML text with innerHTML.
import { countDueTasks } from "./domain";
import type { Task } from "./domain";

export function renderTasks(area: HTMLElement, tasks: Task[], today: string): void {
  const items = tasks
    .map(
      (task) =>
        `<li data-id="${task.id}"><h3>${task.title}</h3><p>${task.dueDate ?? "%%noDue%%"}</p><p>${task.done ? "%%doneLabel%%" : "%%pendingLabel%%"}</p></li>`,
    )
    .join("");
  const list = tasks.length === 0 ? "<p>%%empty%%</p>" : `<ul>${items}</ul>`;
  area.innerHTML = `<section><h2>%%heading%%</h2><p>%%dueNow%%: ${countDueTasks(tasks, today)}</p>${list}</section>`;
}
