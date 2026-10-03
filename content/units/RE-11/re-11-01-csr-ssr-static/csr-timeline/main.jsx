import { createRoot } from "react-dom/client";
import App from "./App";
import { since } from "./clock";

// Pretend download time of the JavaScript bundle. Real downloads take this long on a slow phone;
// here a timer stands in for the network, because the sandbox already has every file.
const BUNDLE_MS = 600;

console.log(`${since()} ms: %%htmlArrived%%`);
await new Promise((resolve) => setTimeout(resolve, BUNDLE_MS));

console.log(`${since()} ms: %%jsRan%%`);
createRoot(document.getElementById("root")).render(<App />);
