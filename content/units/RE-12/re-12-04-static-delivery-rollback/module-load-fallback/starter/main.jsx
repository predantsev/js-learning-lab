import { lazy, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./ErrorBoundary";
import { loadChunk } from "./server.js";

// This tab's bundle is from release v0.2.0, so it knows the v0.2.0 name of the chunk.
const DueToday = lazy(() => loadChunk("DueToday-C7tWm2aQ.js"));

// On the platform a real page reload would restart the sandbox, so it only prints a line.
function reloadPage() {
  console.log("%%reloadAsked%%");
}

function PlannerPage() {
  const [open, setOpen] = useState(false);
  return (
    <main>
      <h1>%%plannerTitle%%</h1>
      <button type="button" onClick={() => setOpen(true)}>
        %%showToday%%
      </button>
      {open && (
        <ErrorBoundary onReload={reloadPage}>
          <Suspense fallback={<p role="status">%%loading%%</p>}>
            <DueToday />
          </Suspense>
        </ErrorBoundary>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<PlannerPage />);
