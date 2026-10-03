import { useState } from "react";
import CategoryTotals from "./CategoryTotals";
import { slowly } from "./slowImport";
import { expenses } from "./expenses";

// TODO: load CategoryTotals.jsx only when the totals are shown for the first time,
// and while its code loads show the status message "%%loadingTotals%%" in the totals area only.

export default function App() {
  const [showTotals, setShowTotals] = useState(false);
  return (
    <div>
      <h1>%%expensesTitle%%</h1>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>{expense.label}</li>
        ))}
      </ul>
      <button onClick={() => setShowTotals(!showTotals)}>
        {showTotals ? "%%hideTotals%%" : "%%showTotals%%"}
      </button>
      {showTotals && <CategoryTotals />}
    </div>
  );
}
