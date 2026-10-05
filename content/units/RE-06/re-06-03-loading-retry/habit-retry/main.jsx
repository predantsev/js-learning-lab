import { createRoot } from "react-dom/client";
import App from "./App";
import ServerSwitch from "./ServerSwitch";
import { settings } from "./fixtureApi.js";

// The switches of the fake server: change them and run again.
settings.delayMs = 700;
settings.failNext = 2;

createRoot(document.getElementById("root")).render(
  <>
    <ServerSwitch />
    <App />
  </>,
);
