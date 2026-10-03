import { createRoot } from "react-dom/client";
import "./fakeServer.js";
import App from "./App";
import ServerSwitch from "./ServerSwitch";

createRoot(document.getElementById("root")).render(
  <>
    <ServerSwitch />
    <App />
  </>,
);
