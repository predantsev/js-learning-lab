// Measuring helpers for this example. They only observe; the page works without them.
import { Profiler } from "react";

const counts = new Map();

// Call at the top of a component's body: counts the renders of the current commit.
export function countRender(name) {
  counts.set(name, (counts.get(name) ?? 0) + 1);
}

// React calls onRender after every commit inside <Profiler>.
// actualDuration: milliseconds React spent rendering this part in that commit.
function report(id, phase, actualDuration) {
  const rendered = [...counts].map(([name, times]) => (times === 1 ? name : `${name} ×${times}`));
  counts.clear();
  console.log(`⏱ ${id} · ${phase} · ${actualDuration.toFixed(1)} ms · ${rendered.join(", ")}`);
}

export function Measure({ id, children }) {
  return (
    <Profiler id={id} onRender={report}>
      {children}
    </Profiler>
  );
}
