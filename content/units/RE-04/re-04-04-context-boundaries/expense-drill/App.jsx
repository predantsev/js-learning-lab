import { useReducer } from "react";
import { START_EXPENSES, expensesReducer, formatAmount } from "./expenses.js";

function ExpenseRow({ expense, dispatch }) {
  return (
    <li>
      {expense.label} — {formatAmount(expense.amountMinor)}{" "}
      <button onClick={() => dispatch({ type: "removed", id: expense.id })}>%%remove%%</button>
    </li>
  );
}

function ExpenseList({ expenses, dispatch }) {
  return (
    <ul>
      {expenses.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} dispatch={dispatch} />
      ))}
    </ul>
  );
}

// A layout wrapper: it only draws a heading. It needs neither expenses nor dispatch.
function ExpenseSection({ title, expenses, dispatch }) {
  return (
    <section>
      <h3>{title}</h3>
      <ExpenseList expenses={expenses} dispatch={dispatch} />
    </section>
  );
}

// Another layout wrapper: a frame around the section.
function ExpensePanel({ expenses, dispatch }) {
  return (
    <div className="panel">
      <ExpenseSection title="%%march%%" expenses={expenses} dispatch={dispatch} />
    </div>
  );
}

export default function ExpensePage() {
  const [expenses, dispatch] = useReducer(expensesReducer, START_EXPENSES);
  return (
    <main>
      <h2>%%heading%%</h2>
      <ExpensePanel expenses={expenses} dispatch={dispatch} />
    </main>
  );
}
