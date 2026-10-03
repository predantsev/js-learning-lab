import { hydrateRoot } from "react-dom/client";
import App from "./App";
import { bundle } from "./bundle";

// Collected for the checks; every mismatch is also printed to the console.
export const hydrationErrors = [];
// The elements that came with the server HTML, before React touched anything.
export const serverNodes = [...document.querySelectorAll("#root *")];

hydrateRoot(document.getElementById("root"), <App />, {
  onRecoverableError(error) {
    hydrationErrors.push(error.message);
    console.error(error.message);
  },
});

// The client bundle that starts at App.jsx.
try {
  for (const entry of await bundle("./App.jsx")) {
    const secret = entry.text.includes("demo-RATE-not-a-real-key") ? "  ← demo-RATE-not-a-real-key" : "";
    console.log(`bundle: ${entry.via}${secret}`);
  }
} catch (error) {
  console.error(`${error.name}: ${error.message}`);
}
