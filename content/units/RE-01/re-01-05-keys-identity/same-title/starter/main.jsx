import { createRoot } from "react-dom/client";
import { TaskList } from "./TaskList";
import { tasks } from "./tasks.js";

let shown = tasks;
const root = createRoot(document.getElementById("root"));
function show() {
  root.render(<TaskList tasks={shown} />);
}
show();

document.getElementById("root").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  shown = shown.filter((task) => task.id !== button.dataset.id);
  show();
});
