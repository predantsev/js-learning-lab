import { useCallback, useState } from "react";
import { EXPENSES, monthlyTotals } from "./expenses";

function formatMoney(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}

function MonthlyTotals({ totals, compact }) {
  const shown = compact ? totals.slice(0, 3) : totals;
  return (
    <ul>
      {shown.map((total) => (
        <li key={total.month}>
          {total.month}: {formatMoney(total.sum)} %%currency%%
        </li>
      ))}
    </ul>
  );
}

export default function ExpenseSummary() {
  const [expenses, setExpenses] = useState(EXPENSES);
  const [compact, setCompact] = useState(false);

  const totals = monthlyTotals(expenses);

  const logCount = useCallback(() => {
    console.log(`%%records%% ${expenses.length}`);
  }, [expenses]);

  function addCoffee() {
    setExpenses([...expenses, { id: `e-${expenses.length + 1}`, label: "%%coffee%%", amountMinor: 6500, date: "2026-12-28" }]);
  }

  return (
    <>
      <label>
        <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} /> %%compact%%
      </label>{" "}
      <button onClick={addCoffee}>%%addCoffee%%</button> <button onClick={logCount}>%%count%%</button>
      <MonthlyTotals totals={totals} compact={compact} />
    </>
  );
}
