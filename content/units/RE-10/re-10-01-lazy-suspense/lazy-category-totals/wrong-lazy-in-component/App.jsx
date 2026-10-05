import { lazy, Suspense, useState } from "react";
import { slowly } from "./slowImport";
import { expenses } from "./expenses";

export default function App() {
  const [showTotals, setShowTotals] = useState(false);
  const CategoryTotals = lazy(slowly(() => import("./CategoryTotals")));
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
      <Suspense fallback={<p role="status">%%loadingTotals%%</p>}>
        {showTotals && <CategoryTotals />}
      </Suspense>
    </div>
  );
}
