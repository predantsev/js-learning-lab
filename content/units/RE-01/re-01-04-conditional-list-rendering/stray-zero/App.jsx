import { expenses } from "./expenses.js";

// Amounts are stored in minor units (kopiykas); format them only for display.
function formatAmount(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} %%currency%%`;
}

function ExpenseList({ expenses }) {
  return (
    <ul>
      {expenses.map((expense) => (
        <li key={expense.id}>
          {expense.label} — {formatAmount(expense.amountMinor)}
        </li>
      ))}
    </ul>
  );
}

export function App() {
  return (
    <main>
      <h1>%%heading%%</h1>
      {expenses.length && <ExpenseList expenses={expenses} />}
    </main>
  );
}
