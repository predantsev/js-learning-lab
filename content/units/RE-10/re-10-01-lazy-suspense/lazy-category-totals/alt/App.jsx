import { lazy, Suspense, useState } from "react";
import { slowly } from "./slowImport";
import { expenses } from "./expenses";

const CategoryTotals = lazy(slowly(() => import("./CategoryTotals")));

function TotalsArea() {
  return (
    <Suspense fallback={<p role="status">%%loadingTotals%%</p>}>
      <CategoryTotals />
    </Suspense>
  );
}

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
      <button onClick={() => setShowTotals((shown) => !shown)}>
        {showTotals ? "%%hideTotals%%" : "%%showTotals%%"}
      </button>
      {showTotals && <TotalsArea />}
    </div>
  );
}
