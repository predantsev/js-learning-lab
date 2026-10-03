import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// StrictMode (RE-03): during development React mounts, unmounts and mounts every component once more.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
