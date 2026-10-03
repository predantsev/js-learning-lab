import { createRoot } from "react-dom/client";
import { App } from "./App";

// React draws App inside <div id="root"> and keeps the page in line with it.
createRoot(document.getElementById("root")).render(<App />);
