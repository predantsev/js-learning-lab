import { render } from "./ui/render.js";

const habits = [
  { id: "h-01", name: "%%exercise%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
  { id: "h-03", name: "%%water%%", frequency: "daily", active: true, completions: ["2026-03-01"] },
  { id: "h-05", name: "%%words%%", frequency: "daily", active: false, completions: ["2026-02-20"] },
  { id: "h-08", name: "", frequency: "hourly", active: true, completions: [] },
];

render(habits);
