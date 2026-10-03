import { renderTasks } from "./legacy";
import { tasks, TODAY } from "./tasks";

renderTasks(document.getElementById("root")!, tasks, TODAY);
