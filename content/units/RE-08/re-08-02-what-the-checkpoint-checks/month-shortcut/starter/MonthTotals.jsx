import { useEffect, useState } from "react";
import { expenses } from "./expenses.js";

// "2026-03" moved by `step` months: shiftMonth("2026-12", 1) is "2027-01".
function shiftMonth(month, step) {
  const [year, number] = month.split("-").map(Number);
  const index = year * 12 + (number - 1) + step;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

const asMoney = (amountMinor) => (amountMinor / 100).toFixed(2);

export default function MonthTotals() {
  const [month, setMonth] = useState("2026-03");

  // Keyboard shortcut: the left and right arrow keys move one month back or forward.
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "ArrowRight") setMonth((current) => shiftMonth(current, 1));
      if (event.key === "ArrowLeft") setMonth((current) => shiftMonth(current, -1));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const inMonth = expenses.filter((expense) => expense.date.startsWith(month));
  const totalMinor = inMonth.reduce((sum, expense) => sum + expense.amountMinor, 0);

  return (
    <section>
      <h2>%%monthWord%% {month}</h2>
      <p>%%shortcutHint%%</p>
      <p>
        %%countLabel%% {inMonth.length} · %%totalLabel%% {asMoney(totalMinor)}
      </p>
      <ul>
        {inMonth.map((expense) => (
          <li key={expense.id}>
            {expense.label} — {asMoney(expense.amountMinor)}
          </li>
        ))}
      </ul>
    </section>
  );
}
