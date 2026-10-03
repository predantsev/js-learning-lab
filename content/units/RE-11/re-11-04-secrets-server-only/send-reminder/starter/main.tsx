import { createRoot } from "react-dom/client";
import ReminderButton from "./ReminderButton";
import { bundle } from "./bundle";

createRoot(document.getElementById("root")!).render(<ReminderButton taskId="t-05" title="%%dentist%%" />);

// The client bundle that starts at ReminderButton.tsx, as a bundler would build it.
try {
  const files = await bundle("./ReminderButton.tsx");
  console.log(`%%bundleFiles%%: ${files.map((entry) => entry.file).join(", ")}`);
  const leaked = files.filter((entry) => entry.text.includes("demo-REM1-not-a-real-key")).map((entry) => entry.file);
  console.log(`%%keyFoundIn%%: ${leaked.length > 0 ? leaked.join(", ") : "—"}`);
} catch (error) {
  console.error(`${(error as Error).name}: ${(error as Error).message}`);
}
