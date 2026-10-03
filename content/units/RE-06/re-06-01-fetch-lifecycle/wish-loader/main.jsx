import { createRoot } from "react-dom/client";
import App from "./App";
import { settings } from "./fixtureApi.js";

// The switches of the fake server: change them and run again.
settings.delayMs = 800;
settings.failNext = 0;

createRoot(document.getElementById("root")).render(<App />);
