import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import VersionTag from "./VersionTag";
import { buildMeta } from "./buildMeta.js";

function ExpensesPage() {
  return (
    <main>
      <h1>%%expensesTitle%%</h1>
      <ul>
        <li>%%groceries%% — 845.50</li>
        <li>%%transit%% — 520.00</li>
      </ul>
      <VersionTag meta={buildMeta} />
    </main>
  );
}

const root = document.getElementById("root");
flushSync(() => createRoot(root).render(<ExpensesPage />));

// The same check a footer test would make: the page shows exactly the stamped values.
const shown = root.querySelector("small").textContent;
const expected = `%%release%% ${buildMeta.version} · ${buildMeta.commit}`;
console.log(`%%onPage%% ${shown}`);
console.log(shown === expected ? "✓ %%matches%%" : `✗ %%differs%% ${expected}`);
