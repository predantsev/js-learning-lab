// Read-only demo: it uses the exports of all three modules.
import { createTask } from "./tasks.js";
import { describeTask } from "./labels.js";

const task = createTask("t-07", "%%water%%", "high");
console.log(describeTask(task));
