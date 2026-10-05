import { useReducer, useState } from "react";
import type { Dispatch, SubmitEvent } from "react";
import { START_EXPENSES, expensesReducer, formatAmount, nextExpenseId, toMinor } from "./expenses";
import type { Expense, ExpenseAction } from "./expenses";
import { RecordsDispatchContext, useRecordsDispatch } from "./recordsDispatch";

export function ExpenseRow({ expense }: { expense: Expense }) {
  const dispatch = useRecordsDispatch();
  return (
    <li>
      <span>{expense.label}</span> — {formatAmount(expense.amountMinor)}{" "}
      <button onClick={() => dispatch({ type: "removed", id: expense.id })}>%%remove%%</button>
    </li>
  );
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <ul>
      {expenses.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} />
      ))}
    </ul>
  );
}

export function AddExpenseForm() {
  const dispatch = useRecordsDispatch();
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

// Draws the board. It needs the expenses for the total; dispatch now reaches the rows and the form through the context.
function ExpenseBoard({ expenses, dispatch }: { expenses: Expense[]; dispatch: Dispatch<ExpenseAction> }) {
  const total = expenses.reduce((sum, expense) => sum + expense.amountMinor, 0);
  return (
    <section>
      <h2>%%heading%%</h2>
      <RecordsDispatchContext value={dispatch}>
        <ExpenseList expenses={expenses} />
      </RecordsDispatchContext>
      <p>
        %%total%% {formatAmount(total)}
      </p>
      <AddExpenseForm />
    </section>
  );
}

export default function ExpensePage() {
  const [expenses, dispatch] = useReducer(expensesReducer, START_EXPENSES);
  return <ExpenseBoard expenses={expenses} dispatch={dispatch} />;
}
