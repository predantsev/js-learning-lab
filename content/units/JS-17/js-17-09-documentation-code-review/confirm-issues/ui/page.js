import { groupByDueDate } from "../domain/planner.js";

const CHECK_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor"/></svg>';

// Draws one section per due date, with a "done" button for every task.
export function renderGroups(root, tasks, onDone) {
  root.replaceChildren();
  for (const [date, group] of groupByDueDate(tasks)) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = date;
    section.append(heading);
    for (const task of group) {
      const row = document.createElement("p");
      row.innerHTML = `<span class="title">${task.title}</span>`;
      const done = document.createElement("button");
      done.type = "button";
      done.innerHTML = CHECK_ICON;
      done.addEventListener("click", () => onDone(task.id));
      row.append(done);
      section.append(row);
    }
    root.append(section);
  }
  if (tasks.length > 500) {
    document.querySelector("#hint").hidden = false;
  }
}
