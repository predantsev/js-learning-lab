import { countDueTasks } from "./domain/planner.js";
import { renderGroups } from "./ui/page.js";
import { saveTasks } from "./storage/planner.js";

export function start(root, storage, tasks, today) {
  const show = () => {
    renderGroups(root, tasks, (id) => {
      tasks = tasks.map((task) => (task.id === id ? { ...task, done: true } : task));
      saveTasks(storage, tasks);
      show();
    });
    document.querySelector("#due").textContent = String(countDueTasks(tasks, today));
  };
  show();
}
