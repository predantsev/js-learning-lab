import { lazy, Suspense, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { loadChunk } from "./server.js";

// This tab loaded index.html of release v0.2.0, so its bundle knows the v0.2.0 name of the chunk.
const Stats = lazy(() => loadChunk("Stats-DTm_fCmj.js"));

export default function App() {
  const [showStats, setShowStats] = useState(false);
  return (
    <main>
      <h1>%%wishlistTitle%%</h1>
      <ul>
        <li>%%headphones%%</li>
        <li>%%lamp%%</li>
        <li>%%bicycle%%</li>
      </ul>
      <button type="button" onClick={() => setShowStats(true)}>
        %%showStats%%
      </button>
      {showStats && (
        <ErrorBoundary>
          <Suspense fallback={<p role="status">%%loading%%</p>}>
            <Stats />
          </Suspense>
        </ErrorBoundary>
      )}
    </main>
  );
}
