import { createRoot } from "react-dom/client";
import { ExpenseTable } from "./ExpenseTable";
import { before, after } from "./expenses.js";
import { watchCommits } from "./dom-log.js";

const container = document.getElementById("root");
watchCommits(container);
const root = createRoot(container);
let expenses = before;
function show() {
  root.render(
    <>
      <button type="button" data-action="next">%%next%%</button>
      <ExpenseTable expenses={expenses} />
    </>,
  );
}
show();

container.addEventListener("click", (event) => {
  if (event.target.closest("button")?.dataset.action !== "next") return;
  expenses = after;
  console.log("--- %%next%%");
  show();
});
