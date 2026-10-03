import { createRoot } from "react-dom/client";
import { App } from "./components";
import { tasks, TODAY } from "./tasks";

createRoot(document.getElementById("root")!).render(<App tasks={tasks} today={TODAY} />);
