import { createRoot } from "react-dom/client";
import { version } from "react";
import ExpenseCard from "./ExpenseCard";

console.log(`React ${version}`);
createRoot(document.getElementById("root")).render(
  <main>
    <h1>%%title%%</h1>
    <ExpenseCard id="e-01" />
  </main>,
);
