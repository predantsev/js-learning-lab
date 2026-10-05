import { useReducer, useState } from "react";
import type { Dispatch, SubmitEvent } from "react";
import { START_EXPENSES, expensesReducer, formatAmount, nextExpenseId, toMinor } from "./expenses";
import type { Expense, ExpenseAction } from "./expenses";

export function ExpenseRow({ expense, dispatch }: { expense: Expense; dispatch: Dispatch<ExpenseAction> }) {
  return (
    <li>
      <span>{expense.label}</span> — {formatAmount(expense.amountMinor)}{" "}
      <button onClick={() => dispatch({ type: "removed", id: expense.id })}>%%remove%%</button>
    </li>
  );
}

export function ExpenseList({ expenses, dispatch }: { expenses: Expense[]; dispatch: Dispatch<ExpenseAction> }) {
  return (
    <ul>
      {expenses.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} dispatch={dispatch} />
      ))}
    </ul>
  );
}

export function AddExpenseForm({ dispatch }: { dispatch: Dispatch<ExpenseAction> }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = toMinor(amount);
    if (label.trim() === "" || amountMinor === null) return;
    dispatch({ type: "added", expense: { id: nextExpenseId(), label: label.trim(), amountMinor: amountMinor } });
    setLabel("");
    setAmount("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%labelField%% <input value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label>
        %%amountField%% <input value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>
      <button type="submit">%%add%%</button>
    </form>
  );
}

// Draws the board. It needs the expenses for the total, but never uses dispatch itself.
function ExpenseBoard({ expenses, dispatch }: { expenses: Expense[]; dispatch: Dispatch<ExpenseAction> }) {
  const total = expenses.reduce((sum, expense) => sum + expense.amountMinor, 0);
  return (
    <section>
      <h2>%%heading%%</h2>
      <ExpenseList expenses={expenses} dispatch={dispatch} />
      <p>
        %%total%% {formatAmount(total)}
      </p>
      <AddExpenseForm dispatch={dispatch} />
    </section>
  );
}

export default function ExpensePage() {
  const [expenses, dispatch] = useReducer(expensesReducer, START_EXPENSES);
  return <ExpenseBoard expenses={expenses} dispatch={dispatch} />;
}
