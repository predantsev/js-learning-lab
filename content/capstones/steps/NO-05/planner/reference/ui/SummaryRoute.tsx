// The route #/tasks/summary, loaded lazily: DueToday.tsx is fetched only when the route opens for
// the first time. esbuild (`--splitting`) writes it to its own file in dist/, and until it arrives
// the Suspense boundary shows a loading line in place of this route only: the layout stays.
// A failed load (no network, a file gone after a new build) throws into the error boundary. Two
// things remember the failure: React keeps a lazy component that failed, so "Try again" creates a
// new one and a fresh boundary; and the browser keeps a module address that failed for the life of
// the page (Chrome 154 did not even ask the server again), so when the new attempt fails too, the
// error offers a page reload — after a new build it also brings the new file names.
import { lazy, Suspense, useState } from "react";
import { ScreenBoundary } from "./ScreenBoundary.tsx";

// For the tests and for watching the fallback: failNext makes the next load fail once, delayMs waits
// before the load starts.
export const summaryImport = { failNext: false, delayMs: 0 };

async function loadSummary() {
  if (summaryImport.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, summaryImport.delayMs));
  }
  if (summaryImport.failNext) {
    summaryImport.failNext = false;
    throw new TypeError("Failed to fetch dynamically imported module (summaryImport.failNext)");
  }
  return import("./DueToday.tsx");
}

export function SummaryRoute({ today }: { today: string }) {
  const [Summary, setSummary] = useState(() => lazy(loadSummary));
  const [attempt, setAttempt] = useState(0);
  function retry() {
    setSummary(() => lazy(loadSummary));
    setAttempt(attempt + 1);
  }
  return (
    <ScreenBoundary
      key={attempt}
      onRetry={retry}
      extra={
        attempt > 0 && (
          <p>
            %%reloadHintMessage%%{" "}
            <button type="button" onClick={() => location.reload()}>
              %%reloadPageLabel%%
            </button>
          </p>
        )
      }
    >
      <Suspense fallback={<p role="status">%%loadingSummaryMessage%%</p>}>
        <Summary today={today} />
      </Suspense>
    </ScreenBoundary>
  );
}
