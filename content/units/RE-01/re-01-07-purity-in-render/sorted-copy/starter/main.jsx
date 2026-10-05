import { createRoot } from "react-dom/client";
import { App } from "./App";
import { tasks } from "./tasks.js";

const root = createRoot(document.getElementById("root"));
function show() {
  root.render(<App tasks={tasks} />);
}
show();

document.getElementById("root").addEventListener("click", (event) => {
  if (event.target.closest("button")) show();
});
