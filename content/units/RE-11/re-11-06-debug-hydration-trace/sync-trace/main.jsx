import { hydrateRoot } from "react-dom/client";
import SyncStatus from "./SyncStatus";
import { bundle } from "./bundle";

// Part 1 of the trace: hydration of the supplied server HTML (errors appear on the error card).
hydrateRoot(document.getElementById("root"), <SyncStatus />);

// Part 2 of the trace: the client bundle that starts at SyncStatus.jsx.
try {
  for (const entry of await bundle("./SyncStatus.jsx")) {
    const secret = entry.text.includes("demo-SYNC-not-a-real-token") ? "  ← demo-SYNC-not-a-real-token" : "";
    console.log(`bundle: ${entry.via}${secret}`);
  }
} catch (error) {
  console.error(`${error.name}: ${error.message}`);
}
