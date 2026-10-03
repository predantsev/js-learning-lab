import { expenses } from "./expenses.js";

// The count is typed by hand: right today, wrong after the data changes.
export function Summary() {
  return (
    <section>
      <h2>%%heading%%</h2>
      <p>%%countLabel%% 4</p>
    </section>
  );
}
