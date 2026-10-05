import { createRoot } from "react-dom/client";
import ReminderButton from "./ReminderButton";
import { bundle } from "./bundle";

createRoot(document.getElementById("root")).render(<ReminderButton taskId="t-02" title="%%library%%" />);

// What would the client bundle starting at ReminderButton.jsx contain?
try {
  const files = await bundle("./ReminderButton.jsx");
  console.log(`%%bundleFiles%%: ${files.map((entry) => entry.file).join(", ")}`);
  const leaked = files.some((entry) => entry.text.includes("demo-REM1-not-a-real-key"));
  console.log(`%%containsKey%%: ${leaked ? "%%yes%%" : "%%no%%"}`);
} catch (error) {
  console.error(`${error.name}: ${error.message}`);
}
