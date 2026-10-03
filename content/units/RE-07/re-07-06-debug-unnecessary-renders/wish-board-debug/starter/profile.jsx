// Measuring helper: prints one line per commit for the part of the page it wraps.
import { Profiler } from "react";

// actualDuration: milliseconds React spent rendering this part in that commit.
function report(id, phase, actualDuration) {
  console.log(`⏱ ${id} · ${phase} · ${actualDuration.toFixed(1)} ms`);
}

export function Measure({ id, children }) {
  return (
    <Profiler id={id} onRender={report}>
      {children}
    </Profiler>
  );
}
