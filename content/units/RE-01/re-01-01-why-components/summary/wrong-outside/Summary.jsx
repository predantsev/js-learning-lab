import { expenses } from "./expenses.js";

// The count is computed once, when the module loads: it does not follow later changes.
const count = expenses.length;

export function Summary() {
  return (
    <section>
      <h2>%%heading%%</h2>
      <p>%%countLabel%% {count}</p>
    </section>
  );
}
