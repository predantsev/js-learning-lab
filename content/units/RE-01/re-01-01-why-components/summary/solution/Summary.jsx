import { expenses } from "./expenses.js";

// Return a heading and a paragraph with the number of expenses.
export function Summary() {
  return (
    <section>
      <h2>%%heading%%</h2>
      <p>%%countLabel%% {expenses.length}</p>
    </section>
  );
}
