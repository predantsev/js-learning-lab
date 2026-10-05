import { lazy, Suspense, useState } from "react";
import { slowly } from "./slowImport";
import { expenses } from "./expenses";

const CategoryTotals = lazy(slowly(() => import("./CategoryTotals")));

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
      <Suspense fallback={<p>%%loadingTotals%%</p>}>
        {showTotals && <CategoryTotals />}
      </Suspense>
    </div>
  );
}
