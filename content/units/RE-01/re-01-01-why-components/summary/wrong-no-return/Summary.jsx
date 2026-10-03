import { expenses } from "./expenses.js";

// The markup is written, but nothing is returned.
export function Summary() {
  <section>
    <h2>%%heading%%</h2>
    <p>%%countLabel%% {expenses.length}</p>
  </section>;
}
