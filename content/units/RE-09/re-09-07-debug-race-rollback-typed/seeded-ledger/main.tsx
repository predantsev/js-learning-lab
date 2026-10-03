import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ExpenseScreen } from "./App";
import { DAMAGED, setAnswer } from "./fixtureServer";

// Restarting mounts a fresh screen (a new key), which loads the list again.
function Scenario() {
  const [run, setRun] = useState(1);
  return (
    <main>
      <h2>%%heading%%</h2>
      <p>
        <button
          onClick={() => {
            setAnswer(DAMAGED);
            setRun(run + 1);
          }}
        >
          %%restartDamaged%%
        </button>
      </p>
      <ExpenseScreen key={run} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Scenario />);
