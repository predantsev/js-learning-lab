import { hydrateRoot } from "react-dom/client";
import App from "./App";

// Collected for the checks; every mismatch is also printed to the console.
export const hydrationErrors = [];
// The <time> elements that came with the server HTML, before React touched anything.
export const serverTimes = [...document.querySelectorAll("#root time")];

hydrateRoot(document.getElementById("root"), <App />, {
  onRecoverableError(error) {
    hydrationErrors.push(error.message);
    console.error(error.message);
  },
});
